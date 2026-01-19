const nodemailer = require('nodemailer');

// Create transporter with multiple fallback options
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail service directly instead of manual host
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  connectionTimeout: 30000, // Increased timeout to 30 seconds
  greetingTimeout: 30000,
  socketTimeout: 30000,
  debug: true,
  logger: true,
  pool: true, // Use pooled connections
  maxConnections: 5,
  maxMessages: 100
});

const sendWelcomeEmail = async (to, name) => {
  const mailOptions = {
    from: `"Ownquesta — Explainable AutoML" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🎉 Welcome to Ownquesta — Explainable AutoML Workflow Platform',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Ownquesta</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%); border-radius: 20px; box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5); border: 1px solid rgba(102, 126, 234, 0.3); overflow: hidden;">
                
                <!-- Logo Section -->

                <!-- Introduction -->
                <tr>
                  <td style="padding: 35px 40px 30px;">
                    <p style="margin: 0; color: #e2e8f0; font-size: 17px; line-height: 1.7; text-align: center;">
                      Congratulations on joining <strong style="color: #a5b4fc;">Ownquesta — Explainable AutoML Workflow Platform</strong>! You're now part of a revolutionary platform that combines explainable artificial intelligence with automated machine learning workflows to help you unlock insights from your data like never before. 🚀
                    </p>
                  </td>
                </tr>

                <!-- Why Important Box -->
                <tr>
                  <td style="padding: 0 40px 35px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%); border-left: 5px solid #667eea; border-radius: 14px; padding: 25px 28px; box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);">
                          <h3 style="margin: 0 0 15px; color: #c7d2fe; font-size: 19px; font-weight: 600; letter-spacing: 0.3px;">💡 Why Ownquesta is Important for You</h3>
                          <p style="margin: 0; color: #cbd5e1; font-size: 16px; line-height: 1.7;">
                            In today's data-driven world, the ability to quickly analyze and understand data is crucial for success. Ownquesta empowers you to make <strong style="color: #a5b4fc;">data-backed decisions without requiring extensive technical knowledge</strong>. Whether you're a business analyst, researcher, or entrepreneur, our <strong style="color: #a5b4fc;">Explainable AutoML technology</strong> saves you countless hours while providing transparent insights that you can trust and understand - not just "black box" predictions.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr             </svg>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Header Section -->
                <tr>
                  <td align="center" style="padding: 0 40px 35px;">
                    <h1 style="margin: 0 0 12px; color: #ffffff; font-size: 34px; font-weight: 700; line-height: 1.2; text-shadow: 0 2px 15px rgba(0,0,0,0.4);">Welcome to Ownquesta, ${name}! 🎉</h1>
                    <p style="margin: 0; color: #a5b4fc; font-weight: 600; font-size: 19px; letter-spacing: 0.8px; line-height: 1.4;">Explainable AutoML Workflow Platform</p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">

                <!-- Why Choose Section -->
                <tr>
                  <td style="padding: 0 40px 35px;">
                    <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 26px; font-weight: 600; text-align: center;">✨ Why Choose Ownquesta?</h2>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="background: rgba(99, 102, 241, 0.08); border-radius: 10px; border-left: 4px solid #667eea; padding: 16px 20px;">
                                <div style="color: #cbd5e1; font-size: 16px; line-height: 1.7;">
                                  <span style="font-size: 20px; margin-right: 8px;">🤖</span>
                                  <strong style="color: #c7d2fe;">Explainable AutoML:</strong> Our advanced machine learning workflows automatically analyze your datasets and provide transparent, explainable insights - understand not just what happened, but why
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>

                <!-- What You Can Do -->
                <tr>
                  <td style="padding: 0 40px 35px;">
                    <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 26px; font-weight: 600; text-align: center;">🎯 What You Can Do</h2>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(51, 65, 85, 0.5) 100%); border-radius: 14px; border: 1px solid rgba(102, 126, 234, 0.35); padding: 28px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);">

                <!-- Getting Started -->
                <tr>
                  <td style="padding: 0 40px 35px;">
                    <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 26px; font-weight: 600; text-align: center;">🚀 Getting Started</h2>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 0 0 14px 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td width="40" valign="top" style="padding-right: 15px;">
                                      <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); text-align: center; line-height: 40px; font-size: 18px; color: white; font-weight: 700;">1</div>
                                    </td>
                                    <td valign="middle">
                                      <div style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                                        <span style="margin-right: 8px;">👤</span>
                                        <strong style="color: #c7d2fe;">Complete your profile</strong> in the settings
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 0 0 14px 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td width="40" valign="top" style="padding-right: 15px;">
                                      <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); text-align: center; line-height: 40px; font-size: 18px; color: white; font-weight: 700;">2</div>
                                    </td>
                                    <td valign="middle">
                                      <div style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                                        <span style="margin-right: 8px;">📁</span>
                                        <strong style="color: #c7d2fe;">Upload your first dataset</strong> in the Data Lab
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 0 0 14px 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td width="40" valign="top" style="padding-right: 15px;">
                                      <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); text-align: center; line-height: 40px; font-size: 18px; color: white; font-weight: 700;">3</div>
                                    </td>
                                    <td valign="middle">
                                      <div style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                                        <span style="margin-right: 8px;">🤖</span>
                                        <strong style="color: #c7d2fe;">Try our AutoML workflows</strong> in Machine Learning
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td width="40" valign="top" style="padding-right: 15px;">
                                      <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); text-align: center; line-height: 40px; font-size: 18px; color: white; font-weight: 700;">4</div>
                                    </td>
                                    <td valign="middle">
                                      <div style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                                        <span style="margin-right: 8px;">📊</span>
                                        <strong style="color: #c7d2fe;">Explore the dashboard</strong> for instant insights
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 10px 40px 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius: 14px; background: linear-gradient(135deg, #6e54c8 0%, #7c49a9 100%); box-shadow: 0 10px 30px rgba(110, 84, 200, 0.6);">
                          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 18px 45px; color: #ffffff; text-decoration: none; font-size: 17px; font-weight: 600; letter-spacing: 0.8px; border-radius: 14px;">
                            🚀 Start Exploring Ownquesta
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.3) 50%, transparent 100%);"></div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 30px 40px 45px;">
                    <p style="margin: 0 0 10px; color: #94a3b8; font-size: 15px; line-height: 1.7;">
                      Need help? Contact our support team at<br>
                      <a href="mailto:support@ownquesta.com" style="color: #a5b4fc; text-decoration: none; font-weight: 600;">support@ownquesta.com</a>
                    </p>
                    <p style="margin: 15px 0 0; color: #94a3b8; font-size: 15px; line-height: 1.7;">
                      Happy analyzing! 🎉
                    </p>
                    <p style="margin: 18px 0 0; color: #cbd5e1; font-size: 16px; font-weight: 600; line-height: 1.4;">
                      The Ownquesta Team
                    </p>
                    <p style="margin: 8px 0 0; color: #64748b; font-size: 13px; letter-spacing: 0.5px; font-style: italic;">
                      Explainable AutoML Workflow Platform
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html                   </td>
                            </tr>
                            <tr>
                              <td>
                                <div style="color: #cbd5e1; font-size: 16px; line-height: 1.8;">
                                  <span style="font-size: 22px; margin-right: 10px;">🔐</span>
                                  <strong style="color: #c7d2fe;">Secure Workspace:</strong> Enable 2FA and manage your account with enterprise security
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr           </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="background: rgba(99, 102, 241, 0.08); border-radius: 10px; border-left: 4px solid #667eea; padding: 16px 20px;">
                                <div style="color: #cbd5e1; font-size: 16px; line-height: 1.7;">
                                  <span style="font-size: 20px; margin-right: 8px;">✅</span>
                                  <strong style="color: #c7d2fe;">Real-time Validation:</strong> Get instant feedback on data quality and potential issues before you invest time in analysis
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="background: rgba(99, 102, 241, 0.08); border-radius: 10px; border-left: 4px solid #667eea; padding: 16px 20px;">
                                <div style="color: #cbd5e1; font-size: 16px; line-height: 1.7;">
                                  <span style="font-size: 20px; margin-right: 8px;">📊</span>
                                  <strong style="color: #c7d2fe;">Interactive Dashboards:</strong> Visualize your data with beautiful, interactive charts and graphs that make complex data easy to understand
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="background: rgba(99, 102, 241, 0.08); border-radius: 10px; border-left: 4px solid #667eea; padding: 16px 20px;">
                                <div style="color: #cbd5e1; font-size: 16px; line-height: 1.7;">
                                  <span style="font-size: 20px; margin-right: 8px;">🔒</span>
                                  <strong style="color: #c7d2fe;">Secure & Private:</strong> Your data is encrypted and stored securely with enterprise-grade protection - we never share your data with third parties
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="background: rgba(99, 102, 241, 0.08); border-radius: 10px; border-left: 4px solid #667eea; padding: 16px 20px;">
                                <div style="color: #cbd5e1; font-size: 16px; line-height: 1.7;">
                                  <span style="font-size: 20px; margin-right: 8px;">⚡</span>
                                  <strong style="color: #c7d2fe;">Time & Cost Efficient:</strong> What used to take days or weeks now takes minutes, saving you valuable time and resources
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr3 style="color: #c7d2fe; margin-top: 0; margin-bottom: 10px; font-size: 18px; font-weight: 600;">💡 Why Ownquesta is Important for You:</h3>
            <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0;">
              In today's data-driven world, the ability to quickly analyze and understand data is crucial for success. Ownquesta empowers you to make <strong style="color: #a5b4fc;">data-backed decisions without requiring extensive technical knowledge</strong>. Whether you're a business analyst, researcher, or entrepreneur, our <strong style="color: #a5b4fc;">Explainable AutoML technology</strong> saves you countless hours while providing transparent insights that you can trust and understand - not just "black box" predictions.
            </p>
          </div>
          
          <h2 style="color: #f1f5f9; margin-top: 30px; margin-bottom: 15px; font-size: 24px; font-weight: 600;">✨ Why Choose Ownquesta?</h2>
          <ul style="color: #cbd5e1; font-size: 16px; line-height: 1.8; list-style: none; padding-left: 0;">
            <li style="margin-bottom: 12px; padding: 12px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; border-left: 3px solid #667eea;">🤖 <strong style="color: #c7d2fe;">Explainable AutoML:</strong> Our advanced machine learning workflows automatically analyze your datasets and provide transparent, explainable insights - understand not just what happened, but why</li>
            <li style="margin-bottom: 12px; padding: 12px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; border-left: 3px solid #667eea;">📁 <strong style="color: #c7d2fe;">Easy Data Upload:</strong> Simply upload your CSV files and let our AutoML pipelines do the heavy lifting - no coding or technical expertise required</li>
            <li style="margin-bottom: 12px; padding: 12px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; border-left: 3px solid #667eea;">✅ <strong style="color: #c7d2fe;">Real-time Validation:</strong> Get instant feedback on data quality and potential issues before you invest time in analysis</li>
            <li style="margin-bottom: 12px; padding: 12px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; border-left: 3px solid #667eea;">📊 <strong style="color: #c7d2fe;">Interactive Dashboards:</strong> Visualize your data with beautiful, interactive charts and graphs that make complex data easy to understand</li>
            <li style="margin-bottom: 12px; padding: 12px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; border-left: 3px solid #667eea;">🔒 <strong style="color: #c7d2fe;">Secure & Private:</strong> Your data is encrypted and stored securely with enterprise-grade protection - we never share your data with third parties</li>
            <li style="margin-bottom: 12px; padding: 12px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; border-left: 3px solid #667eea;">⚡ <strong style="color: #c7d2fe;">Time & Cost Efficient:</strong> What used to take days or weeks now takes minutes, saving you valuable time and resources</li>
          </ul>
          
          <h2 style="color: #f1f5f9; margin-top: 30px; margin-bottom: 15px; font-size: 24px; font-weight: 600;">🎯 What You Can Do:</h2>
          <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(51, 65, 85, 0.4) 100%); padding: 24px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(102, 126, 234, 0.3); backdrop-filter: blur(10px);">
            <p style="margin: 0; color: #cbd5e1; font-size: 15px; line-height: 1.8;"><strong style="color: #c7d2fe;">🔬 Data Lab:</strong> Upload datasets and get AI-powered insights with explainable results</p>
            <p style="margin: 12px 0 0 0; color: #cbd5e1; font-size: 15px; line-height: 1.8;"><strong style="color: #c7d2fe;">🧠 AutoML Workflows:</strong> Build and train ML models automatically without any coding</p>
            <p style="margin: 12px 0 0 0; color: #cbd5e1; font-size: 15px; line-height: 1.8;"><strong style="color: #c7d2fe;">📈 Smart Visualization:</strong> Create stunning, interactive charts and dashboards instantly</p>
            <p style="margin: 12px 0 0 0; color: #cbd5e1; font-size: 15px; line-height: 1.8;"><strong style="color: #c7d2fe;">🔐 Secure Workspace:</strong> Enable 2FA and manage your account with enterprise security</p>
          </div>
          
          <h2 style="color: #f1f5f9; margin-top: 30px; margin-bottom: 15px; font-size: 24px; font-weight: 600;">🚀 Getting Started:</h2>
          <ol style="color: #cbd5e1; font-size: 16px; line-height: 2;">
            <li style="margin-bottom: 8px;">👤 <strong style="color: #c7d2fe;">Complete your profile</strong> in the settings</li>
            <li style="margin-bottom: 8px;">📁 <strong style="color: #c7d2fe;">Upload your first dataset</strong> in the Data Lab</li>
            <li style="margin-bottom: 8px;">🤖 <strong style="color: #c7d2fe;">Try our AutoML workflows</strong> in Machine Learning</li>
            <li style="margin-bottom: 8px;">📊 <strong style="color: #c7d2fe;">Explore the dashboard</strong> for instant insights</li>
          </ol>
          
          <div style="text-align: center; margin-top: 35px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: linear-gradient(135deg, #6e54c8 0%, #7c49a9 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 8px 24px rgba(110, 84, 200, 0.5); letter-spacing: 0.5px; transition: all 0.3s ease;">
              🚀 Start Exploring Ownquesta
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 14px; margin-top: 35px; text-align: center; border-top: 1px solid rgba(148, 163, 184, 0.2); padding-top: 24px; line-height: 1.8;">
            Need help? Contact our support team at <a href="mailto:support@ownquesta.com" style="color: #a5b4fc; text-decoration: none; font-weight: 500;">support@ownquesta.com</a><br>
            Happy analyzing! 🎉<br>
            <strong style="color: #cbd5e1;">The Ownquesta Team</strong><br>
            <em style="font-size: 12px; color: #64748b; letter-spacing: 0.5px;">Explainable AutoML Workflow Platform</em>
          </p>
        </div>
      </div>
    `,
  };

  try {
    // Verify transporter configuration (will throw if config invalid)
    await transporter.verify();
  } catch (err) {
    console.error('Email transporter verification failed (welcome email):', err);
    return { ok: false, error: err };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to', to);
    return { ok: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { ok: false, error };
  }
};

const sendNotificationEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Ownquesta" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    // Verify transporter configuration (will throw if config invalid)
    await transporter.verify();
  } catch (err) {
    console.error('Email transporter verification failed:', err);
    return { ok: false, error: err };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Notification email sent to', to, 'messageId=', info.messageId);
    return { ok: true, info };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { ok: false, error };
  }
};

module.exports = { sendWelcomeEmail, sendNotificationEmail, transporter };