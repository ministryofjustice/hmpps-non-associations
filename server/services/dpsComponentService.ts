import { RestClientBuilder } from '../data'
import { ComponentApiClient } from '../data/dpsComponents/interfaces/componentApiClient'
import Component from '../data/dpsComponents/interfaces/component'

export default class ComponentService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly componentApiClientBuilder: RestClientBuilder<ComponentApiClient>) {}

  public async getComponent(component: 'header' | 'footer', userToken: string): Promise<Component> {
    return this.componentApiClientBuilder(userToken).getComponent(component, userToken)
  }
}
