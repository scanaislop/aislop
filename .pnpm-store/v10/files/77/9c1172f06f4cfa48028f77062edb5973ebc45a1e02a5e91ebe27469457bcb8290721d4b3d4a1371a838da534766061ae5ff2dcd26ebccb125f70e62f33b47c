import { FileEntryCache } from './util/file-entry-cache.js';
import { timerify } from './util/Performance.js';
import { version } from './version.js';
const dummyFileDescriptor = { key: '', changed: true, notFound: true };
export class CacheConsultant {
    cache;
    getFileDescriptor = () => dummyFileDescriptor;
    reconcile = () => { };
    removeEntry = () => { };
    constructor(name, options) {
        if (!options.isCache)
            return;
        const cacheName = `${name.replace(/[^a-z0-9]/g, '-').replace(/-*$/, '')}-${options.isProduction ? '-prod' : ''}-${version}`;
        this.cache = new FileEntryCache(cacheName, options.cacheLocation);
        this.getFileDescriptor = timerify(this.cache.getFileDescriptor.bind(this.cache));
        this.reconcile = timerify(this.cache.reconcile.bind(this.cache));
        this.removeEntry = timerify(this.cache.removeEntry.bind(this.cache));
    }
    getCachedFile(filePath) {
        if (!this.cache)
            return undefined;
        const fd = this.cache.getFileDescriptor(filePath);
        return !fd.changed ? fd.meta?.data : undefined;
    }
}
