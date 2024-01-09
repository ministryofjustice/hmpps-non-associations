import DpsFeComponentsClient, { type AvailableComponent, type Component } from '../data/dpsFeComponentsClient'

export default class FeComponentsService {
  constructor(private readonly dpsFeComponentsClient: DpsFeComponentsClient) {}

  public async getComponent(component: AvailableComponent, token: string): Promise<Component> {
    return this.dpsFeComponentsClient.getComponent(component, token)
  }
}
