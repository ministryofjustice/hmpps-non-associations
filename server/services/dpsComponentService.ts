import DpsFeComponentsClient, { AvailableComponent, Component } from '../data/dpsFeComponentsClient'

export default class FeComponentsService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly dpsFeComponentsClient: DpsFeComponentsClient) {}

  public async getComponent(component: AvailableComponent, token: string): Promise<Component> {
    return this.dpsFeComponentsClient.getComponent(component, token)
  }
}
