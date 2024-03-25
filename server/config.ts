const production = process.env.NODE_ENV === 'production'

type EnvOptions = { requireInProduction: boolean }
const requiredInProduction: EnvOptions = { requireInProduction: true }
const notRequiredInProduction: EnvOptions = { requireInProduction: false }

function get<T>(name: string, fallback: T, options: EnvOptions = notRequiredInProduction): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

export class AgentConfig {
  // Sets the working socket to timeout after timeout milliseconds of inactivity on the working socket.
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    // sets maximum time to wait for the first byte to arrive from the server, but it does not limit how long the
    // entire download can take.
    response: number
    // sets a deadline for the entire request (including all uploads, redirects, server processing time) to complete.
    // If the response isn't fully downloaded within that time, the request will be aborted.
    deadline: number
  }
  agent: AgentConfig
}

const auditConfig = () => {
  const auditEnabled = get('AUDIT_ENABLED', 'false') === 'true'
  return {
    enabled: auditEnabled,
    queueUrl: get(
      'AUDIT_SQS_QUEUE_URL',
      'http://localhost:4566/000000000000/mainQueue',
      auditEnabled && requiredInProduction,
    ),
    serviceName: get('AUDIT_SERVICE_NAME', 'UNASSIGNED', auditEnabled && requiredInProduction),
    region: get('AUDIT_SQS_REGION', 'eu-west-2'),
  }
}

export default {
  productId: get('PRODUCT_ID', 'UNASSIGNED', requiredInProduction),
  buildNumber: get('BUILD_NUMBER', '2023-05-18.1.39b1b24', requiredInProduction),
  gitRef: get('GIT_REF', 'unknown', requiredInProduction),
  branchName: get('GIT_BRANCH', 'unknown', requiredInProduction),
  environment: process.env.ENVIRONMENT || 'local',
  production, // NB: this is true in _all_ deployed environments
  https: production,
  staticResourceCacheDuration: '1h',
  redis: {
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'clientid', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    manageUsersApi: {
      url: get('MANAGE_USERS_API_URL', 'http://localhost:9091', requiredInProduction),
      timeout: {
        response: Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('MANAGE_USERS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000))),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    nomisUserRolesApi: {
      url: get('NOMIS_USER_ROLES_API_URL', 'http://localhost:8081', requiredInProduction),
      externalUrl: get('NOMIS_USER_ROLES_API_EXTERNAL_URL', get('NOMIS_USER_ROLES_API_URL', 'http://localhost:8081')),
      timeout: {
        response: Number(get('NOMIS_USER_ROLES_API_TIMEOUT_RESPONSE', 8000)),
        deadline: Number(get('NOMIS_USER_ROLES_API_TIMEOUT_DEADLINE', 8000)),
      },
      agent: new AgentConfig(Number(get('NOMIS_USER_ROLES_API_TIMEOUT_RESPONSE', 8000))),
    },
    hmppsPrisonApi: {
      url: get('HMPPS_PRISON_API_URL', 'http://localhost:8080', requiredInProduction),
      externalUrl: get('HMPPS_PRISON_API_EXTERNAL_URL', get('HMPPS_PRISON_API_URL', 'http://localhost:8080')),
      timeout: {
        response: Number(get('HMPPS_PRISON_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_PRISON_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_PRISON_API_TIMEOUT_RESPONSE', 10000))),
    },
    offenderSearchApi: {
      url: get('OFFENDER_SEARCH_API_URL', 'http://localhost:8082', requiredInProduction),
      externalUrl: get('OFFENDER_SEARCH_API_EXTERNAL_URL', get('OFFENDER_SEARCH_API_URL', 'http://localhost:8082')),
      timeout: {
        response: Number(get('OFFENDER_SEARCH_API_TIMEOUT_RESPONSE', 8000)),
        deadline: Number(get('OFFENDER_SEARCH_API_TIMEOUT_DEADLINE', 8000)),
      },
      agent: new AgentConfig(Number(get('OFFENDER_SEARCH_API_TIMEOUT_RESPONSE', 8000))),
    },
    hmppsNonAssociationsApi: {
      url: get('HMPPS_NON_ASSOCIATIONS_API_URL', 'http://localhost:2999', requiredInProduction),
      externalUrl: get(
        'HMPPS_NON_ASSOCIATIONS_API_EXTERNAL_URL',
        get('HMPPS_NON_ASSOCIATIONS_API_URL', 'http://localhost:2999'),
      ),
      timeout: {
        response: Number(get('HMPPS_NON_ASSOCIATIONS_API_TIMEOUT_RESPONSE', 60000)),
        deadline: Number(get('HMPPS_NON_ASSOCIATIONS_API_TIMEOUT_DEADLINE', 60000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_NON_ASSOCIATIONS_API_TIMEOUT_RESPONSE', 60000))),
    },
    frontendComponents: {
      url: get('COMPONENT_API_URL', 'http://localhost:8083', requiredInProduction),
      timeout: {
        response: Number(get('COMPONENT_API_TIMEOUT_SECONDS', 5000)),
        deadline: Number(get('COMPONENT_API_TIMEOUT_SECONDS', 5000)),
      },
      agent: new AgentConfig(Number(get('COMPONENT_API_TIMEOUT_SECONDS', 5000))),
    },
  },
  sqs: {
    audit: auditConfig(),
  },
  googleAnalyticsMeasurementId: get('GOOGLE_ANALYTICS_MEASUREMENT_ID', ''),
  teamEmail: get('TEAM_EMAIL', 'info@digital.justice.gov.uk'),
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  dpsUrl: get('DPS_URL', 'http://dps.local', requiredInProduction),
  feedbackSurveyUrl: get('FEEDBACK_SURVEY_URL', 'http://feedback.dps.local'),
  supportUrl: get('SUPPORT_URL', 'http://support.dps.local', requiredInProduction),
}
