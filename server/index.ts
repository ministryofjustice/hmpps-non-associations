import createApp from './app'
import { services } from './services'

// eslint-disable-next-line import/prefer-default-export
export const app = createApp(services())
