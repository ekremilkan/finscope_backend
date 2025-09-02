const Joi = require('joi');
const { createCampaignSchema } = require('../validations/campaign.validation');

describe('Campaign Validation Tests', () => {
  describe('Required Fields Validation', () => {
    it('should pass with all required fields', () => {
      const validCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: {
          A: 100,
          B: 75,
          C: 50,
          D: 25
        },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(validCampaign);
      expect(error).toBeUndefined();
    });

    it('should fail without company_logo', () => {
      const invalidCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: {
          A: 100,
          B: 75,
          C: 50,
          D: 25
        },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(invalidCampaign);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Şirket logosu zorunludur');
    });

    it('should fail without twitter_url', () => {
      const invalidCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: {
          A: 100,
          B: 75,
          C: 50,
          D: 25
        },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png'
      };

      const { error } = createCampaignSchema.validate(invalidCampaign);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Twitter URL\'si zorunludur');
    });
  });

  describe('Company Logo Validation', () => {
    it('should accept valid HTTP URL', () => {
      const validCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(validCampaign);
      expect(error).toBeUndefined();
    });

    it('should accept valid HTTPS URL', () => {
      const validCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://cdn.example.com/images/logo.jpg',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(validCampaign);
      expect(error).toBeUndefined();
    });

    it('should accept base64 image string', () => {
      const validCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(validCampaign);
      expect(error).toBeUndefined();
    });

    it('should reject invalid URL format', () => {
      const invalidCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'invalid-url',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(invalidCampaign);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Geçerli bir resim URL\'si veya base64 string giriniz');
    });

    it('should reject empty string', () => {
      const invalidCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: '',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(invalidCampaign);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Şirket logosu boş olamaz');
    });
  });

  describe('Twitter URL Validation', () => {
    it('should accept valid twitter.com URL', () => {
      const validCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(validCampaign);
      expect(error).toBeUndefined();
    });

    it('should accept valid x.com URL', () => {
      const validCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://x.com/company'
      };

      const { error } = createCampaignSchema.validate(validCampaign);
      expect(error).toBeUndefined();
    });

    it('should accept www.twitter.com URL', () => {
      const validCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://www.twitter.com/company'
      };

      const { error } = createCampaignSchema.validate(validCampaign);
      expect(error).toBeUndefined();
    });

    it('should accept www.x.com URL', () => {
      const validCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://www.x.com/company'
      };

      const { error } = createCampaignSchema.validate(validCampaign);
      expect(error).toBeUndefined();
    });

    it('should reject non-Twitter URL', () => {
      const invalidCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://facebook.com/company'
      };

      const { error } = createCampaignSchema.validate(invalidCampaign);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Geçerli bir Twitter URL\'si giriniz');
    });

    it('should reject invalid URL format', () => {
      const invalidCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'invalid-url'
      };

      const { error } = createCampaignSchema.validate(invalidCampaign);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Geçerli bir Twitter URL\'si giriniz');
    });

    it('should reject empty string', () => {
      const invalidCampaign = {
        title: 'Test Campaign',
        description: 'Test Description',
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        company_logo: 'https://example.com/logo.png',
        twitter_url: ''
      };

      const { error } = createCampaignSchema.validate(invalidCampaign);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Twitter URL\'si boş olamaz');
    });
  });

  describe('Integration Tests', () => {
    it('should accept campaign with all new fields and segmentation', () => {
      const validCampaign = {
        title: 'Advanced Campaign',
        description: 'Advanced Description',
        content: [
          {
            itemImage: 'https://example.com/image1.jpg',
            itemVideo: 'https://youtube.com/watch?v=123',
            itemTitle: 'Item 1',
            itemDescription: 'Description 1',
            itemIndex: 1
          }
        ],
        rewards: { A: 100, B: 75, C: 50, D: 25 },
        maxParticipants: { A: 10, B: 20, C: 30, D: 40 },
        maxTotalParticipants: 100,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2025-01-31'),
        questions: 5,
        tags: ['blockchain', 'education'],
        company_logo: 'https://example.com/logo.png',
        twitter_url: 'https://twitter.com/company',
        segmentation: {
          portfolioFilters: {
            minTotalValueUsd: 1000,
            minTokenCount: 5
          },
          tokenCategoryPercentage: [
            {
              category: 'defi',
              minPercent: 20
            }
          ]
        }
      };

      const { error } = createCampaignSchema.validate(validCampaign);
      expect(error).toBeUndefined();
    });
  });
});
