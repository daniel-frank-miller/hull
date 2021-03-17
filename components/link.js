import React from 'react'
import NextLink from 'next/link'

import { getStaticRoute, getDynamicRoute } from '@lib/routes'

import { useProductCount } from '@lib/contexts/shopify'

const Link = ({ link, children, ...rest }) => {
  const isLink = !!link.url
  const isStatic = getStaticRoute(link.page?.type)

  // if a collection, get product count
  const isCollection = ['shopPage', 'collection'].includes(link.page?.type)
  const productCounts = useProductCount()
  const collectionCount = productCounts(
    (isCollection && link.page?.slug) || 'all'
  )

  // External Link
  if (isLink) {
    return (
      <a
        href={link.url}
        target={!link.url.match('^mailto:') ? '_blank' : null}
        rel="noopener noreferrer"
        className={link.isButton ? 'btn' : null}
        {...rest}
      >
        {link.title || children}
      </a>
    )
    // Internal Page
  } else {
    const isDynamic = getDynamicRoute(link.page?.type)

    return (
      <NextLink
        href={
          isStatic !== false
            ? `/${isStatic}`
            : `/${isDynamic ? `${isDynamic}/` : ''}${link.page?.slug}`
        }
        scroll={false}
      >
        <a className={link.isButton ? 'btn' : null} {...rest}>
          {link.title || children}

          {isCollection && (
            <span aria-hidden="true" className="collection-count">
              {collectionCount}
            </span>
          )}
        </a>
      </NextLink>
    )
  }
}

export default Link
