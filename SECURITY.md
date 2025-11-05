# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x.x   | ✅ Current         |

## Reporting a Vulnerability

We take the security of ArcAI seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to: **security@arc-ai.com**

When reporting a vulnerability, please include:

- **Description**: A detailed description of the vulnerability
- **Steps to Reproduce**: Clear steps to reproduce the issue
- **Impact**: The potential impact of the vulnerability
- **Environment**: Version of ArcAI, operating system, and any relevant configuration

### What to Expect

- **Confirmation**: We'll acknowledge receipt of your report within 48 hours
- **Assessment**: We'll assess the vulnerability and determine its severity
- **Timeline**: We'll provide an estimated timeline for a fix
- **Coordination**: We'll work with you to coordinate disclosure
- **Credit**: With your permission, we'll credit you in the security advisory

### Response Timeframes

- **Critical**: 7 days to patch
- **High**: 14 days to patch  
- **Medium**: 30 days to patch
- **Low**: 90 days to patch

## Security Best Practices

### For Users

1. **Keep Updated**: Always use the latest version of ArcAI
2. **Environment Variables**: Never commit API keys or secrets to version control
3. **Network Security**: Use HTTPS and secure connections for all communications
4. **Access Control**: Implement proper authentication and authorization
5. **Regular Audits**: Regularly review access logs and user permissions

### For Developers

1. **Input Validation**: Validate all user inputs and sanitize data
2. **Dependency Management**: Keep dependencies updated and scan for vulnerabilities
3. **Secure Defaults**: Use secure default configurations
4. **Least Privilege**: Run services with minimal required permissions
5. **Error Handling**: Don't expose sensitive information in error messages

## Security Features

ArcAI includes several built-in security features:

### Authentication & Authorization

- **Supabase Auth**: Secure user authentication with email/password
- **Role-Based Access**: User roles and permissions management
- **API Key Management**: Secure storage and rotation of API keys

### Data Protection

- **Encryption**: Data encrypted in transit using TLS/SSL
- **Secure Storage**: S3-compatible storage with private ACLs
- **Presigned URLs**: Temporary, secure access to files
- **Environment Variables**: Sensitive configuration stored securely

### Network Security

- **CORS Configuration**: Proper Cross-Origin Resource Sharing setup
- **Rate Limiting**: Protection against API abuse
- **Input Sanitization**: Protection against injection attacks

## Known Security Considerations

### Environment Variables

- API keys and secrets are stored in environment variables
- Ensure proper access controls on your hosting environment
- Rotate keys regularly and monitor for unauthorized use

### File Uploads

- File type restrictions enforced (PDF, TXT, HTML only)
- File size limits (10MB maximum)
- Files stored with private ACL by default

### Third-Party Integrations

- OpenAI API keys are sent to OpenAI services
- Slack bot tokens provide access to Slack workspaces
- Outline API tokens provide read access to documents

## Security Updates

### How We Handle Security Issues

1. **Assessment**: Evaluate severity and impact
2. **Development**: Create and test patches
3. **Coordination**: Coordinate with reporters and maintainers
4. **Disclosure**: Publish security advisories and updates
5. **Communication**: Notify users through appropriate channels

### Security Advisories

Security advisories are published on GitHub and include:

- **CVE Identifier**: When applicable
- **Severity Rating**: Critical, High, Medium, Low
- **Affected Versions**: List of affected versions
- **Patched Versions**: List of patched versions
- **Mitigation**: Steps to protect against the vulnerability
- **Acknowledgments**: Credit to reporters and contributors

## Responsible Disclosure Policy

We follow a responsible disclosure approach:

1. **Private Reporting**: Vulnerabilities reported privately
2. **Time to Fix**: Reasonable time to develop and test patches
3. **Coordinated Disclosure**: Public disclosure coordinated with reporters
4. **Credit Given**: Reporters credited (with permission)

## Security Team

The ArcAI security team is responsible for:

- **Vulnerability Assessment**: Evaluating and prioritizing security issues
- **Security Development**: Implementing security features and fixes
- **Security Review**: Reviewing code changes for security implications
- **Incident Response**: Responding to security incidents and breaches

## Contact Information

- **Security Reports**: security@arc-ai.com
- **General Security Questions**: security@arc-ai.com
- **Security Issues in Dependencies**: Please report through the same channel

## Acknowledgments

We thank all security researchers who help keep ArcAI secure. Your responsible disclosure helps protect all our users.

---

For general questions or support, please use our regular channels:
- [GitHub Issues](https://github.com/your-username/arc-ai/issues)
- [GitHub Discussions](https://github.com/your-username/arc-ai/discussions)