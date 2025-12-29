/**
 * PocketBase Products API Client
 * Handles fetching product data from the backend
 */

class ProductsApi {
    constructor() {
        this.pb = window.PBClient.getInstance();
        this.collection = 'products';
        this.currentLang = document.documentElement.lang || 'ko';
    }

    /**
     * Get list of products with optional filtering
     * @param {Object} options - Filter options
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.perPage - Items per page (default: 20)
     * @param {string} options.sort - Sort order (default: '-created')
     * @param {string} options.filter - Additional filter string
     * @returns {Promise<Object>} - Paginated result list
     */
    async getList({ page = 1, perPage = 20, sort = '-order,-created', filter = '' } = {}) {
        try {
            // Filter by current language and enabled status
            const baseFilter = `language = "${this.currentLang}" && enabled = true`;
            const finalFilter = filter ? `${baseFilter} && (${filter})` : baseFilter;

            console.log('Fetching products with filter:', finalFilter);

            const records = await this.pb.collection(this.collection).getList(page, perPage, {
                sort: sort,
                filter: finalFilter,
            });

            console.log('Products fetched:', records);
            return records;
        } catch (error) {
            console.error('Error fetching product list:', error);
            return { items: [], totalItems: 0, totalPages: 0 };
        }
    }

    /**
     * Get a single product by slug
     * @param {string} slug - Product slug
     * @returns {Promise<Object|null>} - Product record or null
     */
    async getBySlug(slug) {
        try {
            const record = await this.pb.collection(this.collection).getFirstListItem(
                `slug = "${slug}" && language = "${this.currentLang}"`
            );
            return record;
        } catch (error) {
            console.error(`Error fetching product with slug ${slug}:`, error);
            return null;
        }
    }

    /**
     * Get a single product by ID
     * @param {string} id - Product ID
     * @returns {Promise<Object|null>} - Product record or null
     */
    async getById(id) {
        try {
            const record = await this.pb.collection(this.collection).getOne(id);
            return record;
        } catch (error) {
            console.error(`Error fetching product with id ${id}:`, error);
            return null;
        }
    }

    /**
     * Get full image URL
     * @param {Object} record - Product record
     * @param {string} filename - Image filename
     * @param {string} thumb - Thumb size (e.g., '100x100')
     * @returns {string} - Full image URL
     */
    getImageUrl(record, filename, thumb = '') {
        if (!record || !filename) return '';
        const url = this.pb.files.getUrl(record, filename, { thumb: thumb });
        return url;
    }
}

// Export instance
window.productsApi = new ProductsApi();
