import FeComponentsClient, { AvailableComponent, Component } from '../data/feComponentsClient'

export default class FeComponentsService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly feComponentsClient: FeComponentsClient) {}

  public async getComponent(component: AvailableComponent, token: string): Promise<Component> {
    return this.feComponentsClient.getComponent(component, token)
  }
}
