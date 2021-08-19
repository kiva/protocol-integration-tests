# protocol-integration-tests

Integration tests for protocol backend repositories

## Deployment

These integration tests are deployed as a CircleCI orb. When a release has been triggered via github, the CI process
will create a temporary development orb. Once a week, on Mondays, the project maintainer will manually publish to the
global CircleCI Registry whichever development orb matches the latest release in github. As needed, hotfixes may
result in an earlier release.
