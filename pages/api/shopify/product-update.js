import sanityClient from '@sanity/client'
import crypto from 'crypto'
const getRawBody = require('raw-body')

const options = {
  dataset: process.env.SANITY_PROJECT_DATASET,
  projectId: process.env.SANITY_PROJECT_ID,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
}

const sanity = sanityClient(options)

export const config = {
  api: {
    bodyParser: false,
  },
}

const runMiddleware = (req, res, fn) => {
  new Promise((resolve) => {
    if (!req.body) {
      let buffer = ''
      req.on('data', (chunk) => {
        buffer += chunk
      })

      req.on('end', () => {
        resolve()
        req.body = JSON.parse(Buffer.from(buffer).toString())
      })
    }
  })
}

export default async function send(req, res) {
  await runMiddleware(req, res)
  const rawBody = await getRawBody(req)

  // extract shopify data
  const {
    body: { id, title, handle, variants },
  } = req

  // bail if it's not a post request or it's missing an ID
  if (req.method !== 'POST' || !req.body) {
    console.log('must be a POST request with a product ID')
    return res
      .status(200)
      .json({ error: 'must be a POST request with a product ID' })
  }

  // get request integrity header
  const hmac = req.headers['x-shopify-hmac-sha256']
  const generatedHash = await crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_INTEGRITY)
    .update(rawBody, 'utf8', 'hex')
    .digest('base64')

  // bail if shopify integrity doesn't match
  if (hmac !== generatedHash) {
    console.log('not verified from Shopify')
    return res.status(200).json({ error: 'not verified from Shopify' })
  }

  console.log('[update] product sync starting...')

  let stx = sanity.transaction()

  // setup product document
  const product = {
    _type: 'product',
    _id: `product-${id}`,
  }

  // define produt fields
  const productFields = {
    productTitle: title,
    productID: id,
    variantID: variants[0].id,
    price: variants[0].price * 100,
    sku: variants[0].sku,
    wasDeleted: false,
  }

  // create product if doesn't exist
  stx = stx.createIfNotExists(product)

  // patch (update) product document with core shopify data
  stx = stx.patch(`product-${id}`, (patch) => patch.set(productFields))
  // patch (update) title & slug if none has been set
  stx = stx.patch(`product-${id}`, (patch) =>
    patch.setIfMissing({ title: title, slug: { current: handle } })
  )

  // define productVariant documents
  const productVariants = variants.map((variant) => ({
    _type: 'productVariant',
    _id: `productVariant-${variant.id}`,
  }))

  // define productVariant fields
  const productVariantFields = variants.map((variant) => ({
    productTitle: title,
    productID: id,
    variantTitle: variant.title,
    variantID: variant.id,
    price: variant.price * 100,
    sku: variant.sku,
    wasDeleted: false,
  }))

  // create variant if doesn't exist & patch (update) variant with core shopify data
  productVariants.forEach((variant, i) => {
    stx = stx.createIfNotExists(variant)
    stx = stx.patch(variant._id, (patch) => patch.set(productVariantFields[i]))
    stx = stx.patch(variant._id, (patch) =>
      patch.setIfMissing({ title: productVariantFields[i].variantTitle })
    )
  })

  const result = await stx.commit()

  console.log('sync complete!')

  res.statusCode = 200
  res.json(JSON.stringify(result))
}
