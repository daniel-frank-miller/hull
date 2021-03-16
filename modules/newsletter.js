import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import cx from 'classnames'

import BlockContent from '@sanity/block-content-to-react'
import { serializers } from '@lib/serializers'

import { fadeAnim } from '@lib/animate'

import Icon from '@components/icon'

const Newsletter = ({ data = {} }) => {
  // Extract our module data
  const { id, klaviyoListID, terms, submit, successMsg, errorMsg } = data

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)
  const { handleSubmit, register, watch, reset, errors } = useForm()

  const hasAgreed = watch(`acceptTerms-${id}`)

  // Call to reset the form
  const resetForm = (e) => {
    e.preventDefault()
    reset()
    setError(false)
    setSuccess(false)
    setSubmitting(false)
  }

  // handle form submission
  const onSubmit = (data, e) => {
    e.preventDefault()

    // set an error if there's no Klaviyo list supplied...
    if (!klaviyoListID) setError(true)

    // ...and bail out if terms active and not agreed to (or just Klaviyo list is missing)
    if ((!hasAgreed && terms && !klaviyoListID) || !klaviyoListID) return

    setSubmitting(true)
    setError(false)

    fetch('/api/klaviyo/newsletter-join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listID: klaviyoListID,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        setSubmitting(false)
        setSuccess(true)
      })
      .catch((error) => {
        setSubmitting(false)
        setError(true)
        console.log(error)
      })
  }

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <AnimatePresence exitBeforeEnter>
        {!error && !success && (
          <motion.div
            initial="hide"
            animate="show"
            exit="hide"
            variants={fadeAnim}
            className="form--fields"
          >
            <div className="control--group is-inline is-clean">
              <div className={`control${errors.email ? ' has-error' : ''}`}>
                <label htmlFor="email" className="control--label">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  ref={register({
                    required: 'This field is required.',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                      message: 'invalid email address',
                    },
                  })}
                  onFocus={(e) => {
                    e.target.parentNode.classList.add('is-filled')
                  }}
                  onBlur={(e) => {
                    const value = e.target.value
                    e.target.parentNode.classList.toggle('is-filled', value)
                  }}
                  onChange={(e) => {
                    const value = e.target.value
                    e.target.parentNode.classList.toggle('is-filled', value)
                  }}
                />

                {errors.email && (
                  <span role="alert" className="control--error">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className={cx('btn is-primary', {
                  'is-loading': submitting,
                  'is-disabled': terms && !hasAgreed,
                })}
                disabled={submitting || (terms && !hasAgreed)}
              >
                {submit ? submit : 'Send'}
              </button>
            </div>

            {terms && (
              <div className="control">
                <input
                  name={`acceptTerms-${id}`}
                  id={`acceptTerms-${id}`}
                  type="checkbox"
                  ref={register}
                />
                <label
                  htmlFor={`acceptTerms-${id}`}
                  className="control--label for-checkbox"
                >
                  <Icon name="Checkmark" />
                  {terms && (
                    <BlockContent
                      renderContainerOnSingleChild
                      className="rc"
                      blocks={terms}
                      serializers={serializers}
                    />
                  )}
                </label>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}

export default Newsletter
