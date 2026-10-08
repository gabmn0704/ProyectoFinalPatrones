# Dependency security remediation

The initial npm install resolved vulnerable transitive packages, including critical findings in the test-runner dependency chain. The direct Netlify Functions and Vitest dependencies were upgraded to patched major versions, and npm regenerated the dependency lockfile so the affected transitive packages were refreshed.

| Package | Previous resolved version | Remediated version |
|---|---:|---:|
| `@netlify/functions` | 3.1.10 | 6.0.2 |
| `vitest` | 3.2.7 | 5.0.3 |

**Verification:** npm reported zero vulnerabilities after the upgrades; the follow-up GitHub Security Advisories scan found no known CVEs in the current direct dependency set. The scanner reports are retained as session artifacts, not committed with the source.
