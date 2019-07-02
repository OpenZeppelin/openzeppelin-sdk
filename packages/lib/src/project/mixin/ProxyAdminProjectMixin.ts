import Constructable, { AbstractType, GetMixinType } from '../../utils/Mixin';
import ProxyAdmin from '../../proxy/ProxyAdmin';

// A mixin that adds ProxyAdmin field and related ProxyAdminProject methods
// Intented to as a building block for Project class
// Can't extend contructor at that moment due to TypeScript limitations https://github.com/Microsoft/TypeScript/issues/14126
function ProxyAdminProjectMixin<T extends Constructable>(Base: T) {
  return class extends Base {
    public proxyAdmin: ProxyAdmin;

    public async transferAdminOwnership(newAdminOwner: string): Promise<void> {
      await this.proxyAdmin.transferOwnership(newAdminOwner);
    }

    public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void> {
      return this.proxyAdmin.changeProxyAdmin(proxyAddress, newAdmin);
    }
  };
}

export default ProxyAdminProjectMixin;
