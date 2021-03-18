import React, { useRef, useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
// import { useIntersection } from 'use-intersection'
import cx from 'classnames'

import { buildSrcSet, buildSrc } from '@lib/helpers'

const Photo = ({
  photo,
  width,
  height,
  srcSizes = [300, 600, 1200],
  sizes = '(min-width: 940px) 50vw, 100vw',
  layout = 'intrinsic',
  quality = 80,
  hasPlaceholder = true,
  forceLoad,
  onLoad,
  className,
}) => {
  if (!photo) return null

  // const imageRef = useRef()
  const [isLoaded, setIsLoaded] = useState(false)
  const [imageRef, isIntersecting] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    skip: forceLoad,
  })

  // define our aspect ratio if not a background fill
  const aspect =
    typeof width === 'number' && typeof height === 'number'
      ? (height / width) * 100
      : 100 / (photo.customRatio || photo.aspectRatio)

  const aspectCustom =
    layout === 'intrinsic' ? { paddingTop: `${aspect}%` } : null

  // define our src and srcset
  const src = buildSrc(photo, {
    ...{ width },
    ...{ height },
    ...{ quality },
  })

  const srcset = buildSrcSet(photo, {
    ...{ srcSizes },
    ...{ aspect },
    ...{ quality },
  })

  // handle our image onLoad
  function handleLoad() {
    requestAnimationFrame(() => {
      setIsLoaded(true)
    })
  }

  // trigger any onLoad callbacks
  useEffect(() => {
    if (isLoaded && onLoad) onLoad()
  }, [isLoaded])

  return (
    <figure className={className ? className : null}>
      <div
        className={cx('ar', {
          'has-fill': layout === 'fill' || layout === 'contain',
        })}
        style={aspectCustom}
      >
        <picture>
          <img
            ref={imageRef}
            width={width}
            height={height}
            src={forceLoad || isIntersecting ? src : null}
            srcSet={forceLoad || isIntersecting ? srcset : null}
            sizes={sizes}
            decoding="async"
            onLoad={handleLoad}
            alt={photo.alt || photo.asset?.altText}
            className={cx(getSize(layout), { 'is-loaded': isLoaded })}
          />
        </picture>

        {hasPlaceholder && (
          <div className={cx('ar--placeholder', { 'is-loaded': isLoaded })}>
            <img src={photo.lqip} alt="" role="presentation" />
          </div>
        )}
      </div>
    </figure>
  )
}

const getSize = (layout) => {
  switch (layout) {
    case 'intrinsic':
      return 'object-cover'
    case 'fill':
      return 'object-cover'
    case 'contain':
      return 'object-contain'
  }
}

export default Photo
