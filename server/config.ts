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
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    response: number
    deadline: number
  }
  agent: AgentConfig
}

export default {
  productId: get('PRODUCT_ID', 'DPS???', requiredInProduction),
  buildNumber: get('BUILD_NUMBER', '2023-05-18.1.39b1b24', requiredInProduction),
  gitRef: get('GIT_REF', 'unknown', requiredInProduction),
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
      url: get('COMPONENT_API_URL', 'http://localhost:8082', requiredInProduction),
      timeout: {
        response: Number(get('COMPONENT_API_TIMEOUT_SECONDS', 20000)),
        deadline: Number(get('COMPONENT_API_TIMEOUT_SECONDS', 20000)),
      },
      agent: new AgentConfig(Number(get('COMPONENT_API_TIMEOUT_SECONDS', 20000))),
    },
    serviceUrls: {
      digitalPrisons: get('DIGITAL_PRISONS_URL', 'http://localhost:3001', requiredInProduction),
    },
  },
  googleAnalyticsMeasurementId: get('GOOGLE_ANALYTICS_MEASUREMENT_ID', ''),
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  dpsUrl: get('DPS_URL', 'http://localhost:3000', requiredInProduction),
  supportUrl: get('SUPPORT_URL', 'http://localhost:3000', requiredInProduction),
}
