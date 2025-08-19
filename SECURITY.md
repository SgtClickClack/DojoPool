# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of DojoPool seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to julian.g.roberts@gmail.com. You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Preferred Languages

We prefer all communications to be in English.

## Security Measures

We implement the following security measures:

1. Automated Security Scanning Workflow
   - Daily security checks
   - Automated pull requests for security updates
   - CodeQL analysis on codebase
   - Continuous vulnerability monitoring
   - Automated dependency updates

2. Dependency Security
   - Regular dependency updates via Dependabot
   - Forced secure versions through package.json resolutions
   - Automated vulnerability scanning
   - Immediate updates for critical security patches

3. Development Security
   - Security scanning in CI/CD pipeline
   - Code review process for all changes
   - Automated testing for security vulnerabilities
   - Regular security audits
   - Secure dependency version management

4. Monitoring and Response
   - Real-time vulnerability alerts
   - Automated security reporting
   - Quick response to security incidents
   - Regular security assessments

## Security Best Practices

1. Keep all dependencies up to date
2. Follow secure coding guidelines
3. Implement proper authentication and authorization
4. Use HTTPS for all communications
5. Implement rate limiting
6. Regular security training for developers

## Security Updates

Security updates are released as soon as possible after a vulnerability is discovered and patched. We will:

1. Acknowledge receipt of the vulnerability report
2. Confirm the vulnerability
3. Develop a fix
4. Test the fix
5. Release the fix
6. Credit the reporter (if desired)

## Contact

For security-related questions or concerns, please contact julian.g.roberts@gmail.com.
