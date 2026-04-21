import * as React from 'react'

export interface NewsletterSection {
  id: string
  type:
    | 'announcement'
    | 'featured_animal'
    | 'success_story'
    | 'tips'
    | 'events'
    | 'custom'
  title: string
  content: string
  image_url?: string
  cta_text?: string
  cta_url?: string
}

export interface NewsletterTemplateProps {
  orgName: string
  orgLogo?: string
  primaryColor?: string
  sections: NewsletterSection[]
  footerText?: string
  unsubscribeUrl?: string
}

export function NewsletterEmailTemplate({
  orgName,
  orgLogo,
  primaryColor = '#D76B1A',
  sections,
  footerText,
  unsubscribeUrl,
}: NewsletterTemplateProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: '#f5f5f5',
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: '#f5f5f5', padding: '40px 20px' }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  width={600}
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: primaryColor,
                          padding: '32px 40px',
                          textAlign: 'center',
                        }}
                      >
                        {orgLogo && (
                          <img
                            src={orgLogo}
                            alt={orgName}
                            style={{
                              maxWidth: 120,
                              height: 'auto',
                              marginBottom: 16,
                            }}
                          />
                        )}
                        <h1
                          style={{
                            margin: 0,
                            color: '#ffffff',
                            fontSize: 28,
                            fontWeight: 'bold',
                            letterSpacing: '-0.5px',
                          }}
                        >
                          {orgName}
                        </h1>
                        <p
                          style={{
                            margin: '8px 0 0',
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: 14,
                          }}
                        >
                          Foster Network Update
                        </p>
                      </td>
                    </tr>

                    {/* Sections */}
                    {sections.map((section) => (
                      <tr key={section.id}>
                        <td style={{ padding: '40px' }}>
                          <h2
                            style={{
                              margin: '0 0 16px',
                              color: '#2E2E2E',
                              fontSize: 22,
                              fontWeight: 600,
                              borderBottom: `3px solid ${primaryColor}`,
                              paddingBottom: 8,
                              display: 'inline-block',
                            }}
                          >
                            {section.title}
                          </h2>

                          {section.image_url && (
                            <div
                              style={{
                                marginBottom: 20,
                                borderRadius: 8,
                                overflow: 'hidden',
                              }}
                            >
                              <img
                                src={section.image_url}
                                alt={section.title}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  display: 'block',
                                }}
                              />
                            </div>
                          )}

                          <div
                            style={{
                              color: '#4A4A4A',
                              fontSize: 16,
                              lineHeight: 1.6,
                              marginBottom: section.cta_text ? 24 : 0,
                            }}
                            dangerouslySetInnerHTML={{
                              __html: section.content,
                            }}
                          />

                          {section.cta_text && section.cta_url && (
                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                              <a
                                href={section.cta_url}
                                style={{
                                  display: 'inline-block',
                                  padding: '14px 32px',
                                  backgroundColor: primaryColor,
                                  color: '#ffffff',
                                  textDecoration: 'none',
                                  borderRadius: 8,
                                  fontSize: 16,
                                  fontWeight: 600,
                                  boxShadow:
                                    '0 2px 8px rgba(215, 107, 26, 0.3)',
                                }}
                              >
                                {section.cta_text}
                              </a>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Footer */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: '#f9f9f9',
                          padding: '32px 40px',
                          borderTop: '1px solid #e0e0e0',
                        }}
                      >
                        <p
                          style={{
                            margin: '0 0 12px',
                            color: '#666',
                            fontSize: 14,
                            lineHeight: 1.5,
                            textAlign: 'center',
                          }}
                        >
                          {footerText ||
                            `You're receiving this because you're part of the ${orgName} foster network.`}
                        </p>
                        {unsubscribeUrl && (
                          <p
                            style={{
                              margin: '0 0 12px',
                              color: '#888',
                              fontSize: 13,
                              textAlign: 'center',
                            }}
                          >
                            Don&apos;t want these emails?{' '}
                            <a
                              href={unsubscribeUrl}
                              style={{ color: primaryColor }}
                            >
                              Unsubscribe
                            </a>
                            .
                          </p>
                        )}
                        <p
                          style={{
                            margin: '12px 0 0',
                            color: '#999',
                            fontSize: 12,
                            textAlign: 'center',
                          }}
                        >
                          © {new Date().getFullYear()} {orgName}. All rights
                          reserved.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

/**
 * Render the newsletter template to an HTML string.
 * Server-only (uses react-dom/server).
 */
export function renderNewsletterTemplate(
  props: NewsletterTemplateProps
): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { renderToStaticMarkup } = require('react-dom/server')
  return '<!DOCTYPE html>' + renderToStaticMarkup(<NewsletterEmailTemplate {...props} />)
}
