import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Images,
  LayoutGrid,
  Loader2,
  Megaphone,
  Percent,
  Tag,
  UploadCloud,
  X,
  GripVertical,
Pencil,
Trash2,
} from 'lucide-react';

import {
  getBanners,
  getWebHeroBanners,
  createWebHeroBanner,
  updateBanner,
  deleteBanner,
  createBanner,
  getCategoryBanners,
  createCategoryBanner,
  getCategoryCampaigns,
  getWebCategoryCampaignBanners,
  createCategoryCampaign,
  updateCategoryCampaign,
  deleteCategoryCampaign,
  getShopByNeedImages,
  syncShopByNeed,
  getResource,
  updateCategorySettings,
  getContentManagementSections,
  getContentManagementSection,
  createContentManagementSection,
  updateContentManagementSection,
  createContentManagementItem,
  updateContentManagementItem,
  deleteContentManagementItem,
  reorderContentManagementSections,
  uploadContentManagementImage,
} from '../services/adminService';

/* ============================================================
   CONSTANTS
============================================================ */

const DISPLAY_LOCATIONS = [
  'Deals of the Week',
  'Home Banner',
];

const STATUS_OPTIONS = [
  'draft',
  'published',
  'archived',
];

const INITIAL_FORM = {
  image: null,
  display_location: 'Deals of the Week',
  display_order: 1,
  publish_status: 'draft',
  starts_at: '',
  ends_at: '',
};

const INITIAL_CATEGORY_FORM = {
  category_id: '',
  image: null,
  display_order: 1,
  publish_status: 'draft',
  starts_at: '',
  ends_at: '',
};

const APP_BANNER_TYPES = [
  {
    id: 'category',
    title: 'Category Banners',
    description:
      'Large promotional banners shown after selecting a category on the app home screen.',
    icon: <LayoutGrid size={25} />,
  },
  {
    id: 'campaign',
    title: 'Category Campaigns',
    description:
      'Promotional campaigns connected to specific product categories.',
    icon: <Megaphone size={25} />,
  },
  {
    id: 'promotional',
    title: 'Promotional Banners',
    description:
      'General promotional banners displayed across the customer app.',
    icon: <Images size={25} />,
  },
  {
    id: 'offer',
    title: 'Offer / Deal Banners',
    description:
      'Special offers, discounts and deal-focused promotional banners.',
    icon: <Percent size={25} />,
  },
  {
    id: 'other',
    title: 'Other',
    description:
      'Other app banner placements and promotional content.',
    icon: <Tag size={25} />,
  },
];

const WEB_BANNER_TYPES = [
  {
    id: 'hero',
    title: 'Hero Banners',
    description:
      'Manage hero banners displayed on the website.',
    icon: <ImagePlus size={25} />,
  },
  {
    id: 'shop-by-need',
    title: 'Shop by Need',
    description:
      'View existing Shop by Need images stored for the website.',
    icon: <Images size={25} />,
  },
  {
    id: 'category',
    title: 'Category Banners',
    description:
      'Large promotional banners for website category sections.',
    icon: <LayoutGrid size={25} />,
  },
  {
    id: 'campaign',
    title: 'Category Campaigns',
    description:
      'Promotional campaigns connected to website categories.',
    icon: <Megaphone size={25} />,
  },
  {
    id: 'promotional',
    title: 'Promotional Banners',
    description:
      'General promotional banners displayed on the website.',
    icon: <Images size={25} />,
  },
  {
    id: 'offer',
    title: 'Offer / Deal Banners',
    description:
      'Special offers and deal-focused website banners.',
    icon: <Percent size={25} />,
  },
  {
    id: 'other',
    title: 'Other',
    description:
      'Other website banner placements and promotional content.',
    icon: <Tag size={25} />,
  },
];

function getWebSectionKey(section) {
  return String(section?.section_key || section?.key || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
}

const REQUIRED_WEB_HOME_SECTIONS = [
  {
    keys: ['available_coupons', 'coupons'],
    section_key: 'available_coupons',
    section_type: 'coupon_carousel',
    title: 'Available Coupons',
    sort_order: 5,
  },
  {
    keys: [
      'continue_shopping',
      'continue_wellness_journey',
      'personalized_shopping',
    ],
    section_key: 'continue_shopping',
    section_type: 'personalized_shopping',
    title: 'Continue Your Wellness Journey',
    sort_order: 6,
  },
];

const APP_HOME_SECTION_DEFAULTS = [
  {
    section_key: 'app_deals_of_week',
    aliases: ['deals_of_week', 'deals', 'hero_banner'],
    section_type: 'banner_carousel',
    title: 'Deals of the Week',
  },
  {
    section_key: 'app_explore_ayurveda',
    aliases: ['explore_ayurveda', 'explore_categories', 'categories'],
    section_type: 'category_circles',
    title: 'Explore Ayurveda',
  },
  {
    section_key: 'app_bestsellers',
    aliases: ['bestsellers', 'best_sellers', 'featured_products'],
    section_type: 'product_carousel',
    title: 'Bestsellers',
  },
  {
    section_key: 'app_recently_viewed',
    aliases: ['recently_viewed'],
    section_type: 'product_carousel',
    title: 'Recently Viewed',
  },
  {
    section_key: 'app_available_coupons',
    aliases: ['available_coupons', 'coupons', 'offers'],
    section_type: 'coupon_carousel',
    title: 'Available Coupons',
  },
  {
    section_key: 'app_just_arrived',
    aliases: ['just_arrived', 'new_arrivals'],
    section_type: 'product_carousel',
    title: 'Just Arrived',
  },
  {
    section_key: 'app_category_campaigns',
    aliases: ['category_campaigns', 'campaigns'],
    section_type: 'campaign_tiles',
    title: 'Category Campaigns',
  },
  {
    section_key: 'app_all_products',
    aliases: ['all_products', 'product_catalog'],
    section_type: 'product_grid',
    title: 'All Products',
  },
];

const WEB_HOME_SECTION_DEFAULT_ORDER = {
  hero: 1,
  hero_banner: 1,
  shop_by_need: 2,
  explore_categories: 3,
  explore_wellness: 3,
  explore_ayurveda: 3,
  best_deals: 4,
  available_coupons: 5,
  coupons: 5,
  continue_shopping: 6,
  continue_wellness_journey: 6,
  personalized_shopping: 6,
  main_promo: 7,
  main_promo_hero: 7,
  daily_wellness_essentials: 7,
  featured_products: 8,
  category_campaigns: 9,
  campaigns: 9,
  category_product_showcase: 10,
  product_category: 10,
  trust_benefits: 11,
  more_discovery: 12,
};

function getWebHomeSectionDefaultOrder(section) {
  return (
    WEB_HOME_SECTION_DEFAULT_ORDER[getWebSectionKey(section)] ??
    Number.MAX_SAFE_INTEGER
  );
}

function sortWebHomeSections(sections) {
  return sections
    .map((section, index) => ({ section, index }))
    .sort((left, right) => {
      const sortOrderDifference =
        Number(left.section.sort_order) -
        Number(right.section.sort_order);
      if (sortOrderDifference !== 0) {
        return sortOrderDifference;
      }

      const defaultOrderDifference =
        getWebHomeSectionDefaultOrder(left.section) -
        getWebHomeSectionDefaultOrder(right.section);
      return defaultOrderDifference || left.index - right.index;
    })
    .map(({ section }) => section);
}

function isFixedNavbarSection(section) {
  return (
    getWebSectionKey(section) === 'navbar' ||
    section?.section_type === 'navbar'
  );
}

function getWebSectionAction(section) {
  const key = getWebSectionKey(section);

  if (
    ['hero_banner', 'hero'].includes(key) ||
    section?.section_type === 'hero_carousel'
  ) {
    return 'hero';
  }
  if (
    [
      'explore_categories',
      'explore_wellness',
      'explore_ayurveda',
    ].includes(key)
  ) {
    return 'categories';
  }
  if (key === 'shop_by_need') return 'shop-by-need';
  if (
    [
      'main_promo',
      'main_promo_hero',
      'daily_wellness_essentials',
    ].includes(key)
  ) {
    return 'main-promo';
  }
  if (['category_campaigns', 'campaigns'].includes(key)) {
    return 'category-campaigns';
  }
  if (key === 'more_discovery') return 'more-discovery';

  return null;
}

function flattenWebCategories(items) {
  const flattened = [];
  const visit = (categories) => {
    (Array.isArray(categories) ? categories : []).forEach((category) => {
      if (!category || category.is_active === false) return;
      flattened.push(category);
      if (Array.isArray(category.subcategories)) {
        visit(category.subcategories);
      }
    });
  };
  visit(items);
  return flattened;
}

function getUploadedImageUrl(response) {
  const candidates = [
    response?.data?.image_url,
    response?.data?.data?.image_url,
    response?.image_url,
  ];
  return candidates.find(
    (url) => typeof url === 'string' && url.trim()
  ) || '';
}

function validateHomepageImage(file) {
  if (!file) return '';
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    return 'Only JPG, PNG, and WEBP images are allowed.';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'Image must be smaller than 10 MB.';
  }
  return '';
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function ContentManagement() {
  const [currentTime] = useState(() => Date.now());

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const [bannerPlatform, setBannerPlatform] = useState(null);
  const [bannerType, setBannerType] = useState(null);
  const [showAppBannerTypes, setShowAppBannerTypes] = useState(false);
  const [appBannerReturnToHome, setAppBannerReturnToHome] = useState(false);
  const [webPromoReturnToHome, setWebPromoReturnToHome] = useState(false);
  const [appCampaignReturnToHome, setAppCampaignReturnToHome] = useState(false);
  const [appCategoryReturnToHome, setAppCategoryReturnToHome] = useState(false);
  const [activeHeaderCategoryId, setActiveHeaderCategoryId] = useState(null);
  const [headerCategorySavingId, setHeaderCategorySavingId] = useState(null);
  const [headerCategoryError, setHeaderCategoryError] = useState('');

  /* ==========================================================
     WEB CONTENT MANAGEMENT
  ========================================================== */

  const [contentSections, setContentSections] = useState([]);
  const [contentSectionsLoading, setContentSectionsLoading] = useState(false);
  const [contentSectionsSaving, setContentSectionsSaving] = useState(false);
  const [contentSectionsError, setContentSectionsError] = useState('');
  const [draggedSectionId, setDraggedSectionId] = useState(null);
  const [contentSectionEditorOpen, setContentSectionEditorOpen] = useState(false);
  const [contentSectionEditorMode, setContentSectionEditorMode] = useState('create');
  const [contentSectionEditorSaving, setContentSectionEditorSaving] = useState(false);
  const [contentSectionEditorError, setContentSectionEditorError] = useState('');
  const [editingContentSection, setEditingContentSection] = useState(null);

  const [appHomeSections, setAppHomeSections] = useState([]);
  const [appHomeSectionsLoading, setAppHomeSectionsLoading] = useState(false);
  const [appHomeSectionsSaving, setAppHomeSectionsSaving] = useState(false);
  const [appHomeSectionsError, setAppHomeSectionsError] = useState('');

  /* ==========================================================
     APP BANNERS
  ========================================================== */

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingAppBanner, setEditingAppBanner] = useState(null);
  const [appBannerEditSaving, setAppBannerEditSaving] = useState(false);

  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM);

  /* ==========================================================
     CATEGORY BANNERS
  ========================================================== */

  const [categoryBanners, setCategoryBanners] = useState([]);
  const [categories, setCategories] = useState([]);

  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);

  const [categoryError, setCategoryError] = useState('');
  const [categorySuccess, setCategorySuccess] = useState('');

  const [categoryPreviewUrl, setCategoryPreviewUrl] = useState('');
  const [categoryDragActive, setCategoryDragActive] =
    useState(false);

  const categoryFileInputRef = useRef(null);

  const [categoryForm, setCategoryForm] = useState(
    INITIAL_CATEGORY_FORM
  );
  const [editingCategoryBannerId, setEditingCategoryBannerId] =
    useState(null);

  /* ==========================================================
     CATEGORY CAMPAIGNS
  ========================================================== */

  const [categoryCampaigns, setCategoryCampaigns] = useState([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignError, setCampaignError] = useState('');
  const [campaignSuccess, setCampaignSuccess] = useState('');
  const [webCategoryCampaigns, setWebCategoryCampaigns] = useState([]);
  const [webCategoryCampaignLoading, setWebCategoryCampaignLoading] =
    useState(false);
  const [editingWebCategoryCampaign, setEditingWebCategoryCampaign] =
    useState(null);
  const [webCategoryCampaignEditSaving, setWebCategoryCampaignEditSaving] =
    useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    category_id: '',
    image: null,
    sort_order: 1,
    is_active: true,
  });
  const [campaignPreviewUrl, setCampaignPreviewUrl] = useState('');
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const campaignFileInputRef = useRef(null);

  /* ==========================================================
     WEB HERO BANNERS
  ========================================================== */

  const [webHeroBanners, setWebHeroBanners] = useState([]);
  const [webHeroLoading, setWebHeroLoading] = useState(false);
  const [webHeroError, setWebHeroError] = useState('');
  const [webHeroSuccess, setWebHeroSuccess] = useState('');
  const [webHeroSaving, setWebHeroSaving] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteBannerId, setDeleteBannerId] = useState(null);
  const [webHeroForm, setWebHeroForm] = useState({
    image: null,
    title: '',
    sort_order: 1,
    publish_status: 'published',
    starts_at: '',
    ends_at: '',
  });
  const [webHeroPreviewUrl, setWebHeroPreviewUrl] = useState('');
  const [webHeroDragActive, setWebHeroDragActive] = useState(false);
  const webHeroFileInputRef = useRef(null);

  /* ==========================================================
     SHOP BY NEED IMAGES
  ========================================================== */

  const [shopByNeedImages, setShopByNeedImages] = useState([]);
  const [shopByNeedLoading, setShopByNeedLoading] = useState(false);
  const [shopByNeedError, setShopByNeedError] = useState('');
  const [shopByNeedSuccess, setShopByNeedSuccess] = useState('');
  const [showShopByNeedCreate, setShowShopByNeedCreate] = useState(false);
  const [shopByNeedCreateSaving, setShopByNeedCreateSaving] =
    useState(false);
  const [editingShopByNeed, setEditingShopByNeed] = useState(null);
  const [shopByNeedEditSaving, setShopByNeedEditSaving] = useState(false);

  /* ==========================================================
     MAIN PROMO BANNERS
  ========================================================== */

  const [mainPromoBanners, setMainPromoBanners] = useState([]);
  const [mainPromoLoading, setMainPromoLoading] = useState(false);
  const [mainPromoError, setMainPromoError] = useState('');
  const [mainPromoSuccess, setMainPromoSuccess] = useState('');
  const [editingMainPromo, setEditingMainPromo] = useState(null);
  const [mainPromoEditSaving, setMainPromoEditSaving] = useState(false);
  const [showMainPromoCreate, setShowMainPromoCreate] = useState(false);
  const [mainPromoCreateSaving, setMainPromoCreateSaving] = useState(false);

  /* ==========================================================
     LOAD APP BANNERS
  ========================================================== */

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getBanners({
        platform: 'app',
        placement: 'home',
      });

      setBanners(response?.items || []);
    } catch (err) {
      console.error('BANNER LOAD ERROR:', err);

      setError(
        err.message || 'Unable to load banners'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadWebHeroBanners = async () => {
    try {
      setWebHeroLoading(true);
      setWebHeroError('');

      const response = await getWebHeroBanners();
      const items = Array.isArray(response)
        ? response
        : response?.items || response?.data || [];

      setWebHeroBanners(items);
    } catch (error) {
      console.error('Failed to load Web Hero Banners:', error);
      setWebHeroError(
        error?.message || 'Failed to load Web Hero Banners'
      );
    } finally {
      setWebHeroLoading(false);
    }
  };

  const loadShopByNeedImages = async () => {
    try {
      setShopByNeedLoading(true);
      setShopByNeedError('');

      const [storageResponse, bannerResponse] = await Promise.all([
        getShopByNeedImages(),
        getBanners({
          platform: 'web',
          placement: 'shop-by-need',
        }),
      ]);
      const bannerByPath = new Map(
        (bannerResponse?.items || []).map((banner) => [
          banner.storage_path,
          banner,
        ])
      );
      setShopByNeedImages(
        (storageResponse?.files || []).map((file) => ({
          ...file,
          ...(bannerByPath.get(file.storage_path) || {}),
        }))
      );
      return true;
    } catch (error) {
      console.error(
        'Failed to load Shop by Need images:',
        error
      );
      setShopByNeedError(
        error?.message || 'Failed to load Shop by Need images'
      );
      return false;
    } finally {
      setShopByNeedLoading(false);
    }
  };

  const handleCreateShopByNeed = async (formData) => {
    try {
      setShopByNeedCreateSaving(true);
      setShopByNeedError('');
      setShopByNeedSuccess('');

      const sortOrder = Number(formData.get('sort_order'));
      const existingAtPosition = shopByNeedImages.find(
        (item) => Number(item.sort_order) === sortOrder && item.id
      );
      if (
        existingAtPosition &&
        !window.confirm(
          `A Shop by Need banner already exists at position ${sortOrder}. Update that banner instead?`
        )
      ) {
        return;
      }

      if (existingAtPosition) {
        await updateBanner(existingAtPosition.id, formData);
      } else {
        await createBanner(formData);
      }
      setShowShopByNeedCreate(false);

      const loaded = await loadShopByNeedImages();
      if (loaded) {
        setShopByNeedSuccess(
          existingAtPosition
            ? 'Shop by Need banner updated successfully.'
            : 'Shop by Need banner created successfully.'
        );
      }
    } catch (error) {
      console.error('SHOP BY NEED CREATE ERROR:', error);
      setShopByNeedError(
        error?.message || 'Unable to create Shop by Need banner'
      );
    } finally {
      setShopByNeedCreateSaving(false);
    }
  };

  const handleEditShopByNeed = async (bannerId, formData) => {
    try {
      setShopByNeedEditSaving(true);
      setShopByNeedError('');
      setShopByNeedSuccess('');
      await updateBanner(bannerId, formData);
      setEditingShopByNeed(null);
      await loadShopByNeedImages();
      setShopByNeedSuccess('Shop by Need banner updated successfully.');
    } catch (error) {
      console.error('SHOP BY NEED UPDATE ERROR:', error);
      setShopByNeedError(
        error?.message || 'Unable to update Shop by Need banner'
      );
    } finally {
      setShopByNeedEditSaving(false);
    }
  };

  const handleSyncShopByNeed = async () => {
    try {
      setShopByNeedError('');
      setShopByNeedSuccess('');
      setShopByNeedLoading(true);
      await syncShopByNeed();
      const loaded = await loadShopByNeedImages();
      if (loaded) {
        setShopByNeedSuccess(
          'Shop by Need images synced successfully.'
        );
      }
    } catch (error) {
      console.error('SHOP BY NEED SYNC ERROR:', error);
      setShopByNeedError(
        error?.message || 'Unable to sync Shop by Need images'
      );
    } finally {
      setShopByNeedLoading(false);
    }
  };

  const loadMainPromoBanners = async () => {
    try {
      setMainPromoLoading(true);
      setMainPromoError('');

      const response = await getBanners({
        platform: 'web',
        placement: 'main-promo-banner',
      });
      setMainPromoBanners(
        Array.isArray(response?.items) ? response.items : []
      );
    } catch (error) {
      console.error(
        'Failed to load Main Promo Banners:',
        error
      );
      setMainPromoError(
        error?.message || 'Failed to load Main Promo Banners'
      );
    } finally {
      setMainPromoLoading(false);
    }
  };

  const handleCreateMainPromo = async (formData) => {
    try {
      setMainPromoCreateSaving(true);
      setMainPromoError('');
      setMainPromoSuccess('');

      await createBanner(formData);
      setMainPromoSuccess('Main Promo banner created successfully.');
      setShowMainPromoCreate(false);

      await loadMainPromoBanners();
    } catch (error) {
      console.error('MAIN PROMO CREATE ERROR:', error);
      setMainPromoError(
        error?.message || 'Unable to create promo banner'
      );
    } finally {
      setMainPromoCreateSaving(false);
    }
  };

  const handleEditMainPromo = async (bannerId, formData) => {
    try {
      setMainPromoEditSaving(true);
      setMainPromoError('');
      setMainPromoSuccess('');

      await updateBanner(bannerId, formData);
      setMainPromoSuccess('Main Promo banner updated successfully.');
      setEditingMainPromo(null);
      await loadMainPromoBanners();
    } catch (error) {
      console.error('MAIN PROMO UPDATE ERROR:', error);
      setMainPromoError(
        error?.message || 'Unable to update Main Promo banner'
      );
    } finally {
      setMainPromoEditSaving(false);
    }
  };

  const selectWebHeroImage = (image) => {
    if (!image) return;

    setWebHeroError('');
    setWebHeroSuccess('');

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(image.type)) {
      setWebHeroError('Only JPG, PNG, and WEBP images are allowed.');
      return;
    }

    if (image.size > 10 * 1024 * 1024) {
      setWebHeroError('Banner image must be smaller than 10 MB.');
      return;
    }

    const preview = URL.createObjectURL(image);
    const previewImage = new Image();
    previewImage.onload = () => {
      if (Math.abs(previewImage.width / previewImage.height - 4.4) > 0.03) {
        URL.revokeObjectURL(preview);
        setWebHeroError(
          `Invalid banner ratio. Please use a 4.4:1 image. Current image is ${previewImage.width} × ${previewImage.height}.`
        );
        return;
      }

      if (webHeroPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(webHeroPreviewUrl);
      }
      setWebHeroPreviewUrl(preview);
      setWebHeroForm((current) => ({
        ...current,
        image,
      }));
    };
    previewImage.onerror = () => {
      URL.revokeObjectURL(preview);
      setWebHeroError('Unable to read the selected image.');
    };
    previewImage.src = preview;
  };

  const handleWebHeroImageChange = (event) => {
    selectWebHeroImage(event.target.files?.[0]);
  };

  const handleWebHeroImageDrop = (event) => {
    event.preventDefault();
    setWebHeroDragActive(false);
    selectWebHeroImage(event.dataTransfer.files?.[0]);
  };

  const handleWebHeroFormChange = (event) => {
    const { name, value } = event.target;
    setWebHeroForm((current) => ({
      ...current,
      [name]:
        name === 'sort_order'
          ? Math.max(1, Number(value))
          : value,
    }));
  };

  const removeWebHeroImage = () => {
    if (webHeroPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(webHeroPreviewUrl);
    }

    setWebHeroPreviewUrl('');
    setWebHeroForm((current) => ({
      ...current,
      image: null,
    }));

    if (webHeroFileInputRef.current) {
      webHeroFileInputRef.current.value = '';
    }
  };

  const resetWebHeroForm = () => {
    removeWebHeroImage();
    setWebHeroForm({
      image: null,
      title: '',
      sort_order:
        webHeroBanners.length > 0
          ? Math.max(
              ...webHeroBanners.map((banner) =>
                Number(banner.sort_order) || 0
              )
            ) + 1
          : 1,
      publish_status: 'published',
      starts_at: '',
      ends_at: '',
    });
    setWebHeroError('');
  };

  const handleWebHeroSubmit = async (event) => {
    event.preventDefault();
    setWebHeroError('');
    setWebHeroSuccess('');

    if (!webHeroForm.image && !webHeroForm.title.trim()) {
      setWebHeroError(
        'Please upload a banner image or enter banner text.'
      );
      return;
    }

    try {
      setWebHeroSaving(true);
      const formData = new FormData();

      formData.append('platform', 'web');
      formData.append('placement', 'hero');
      if (webHeroForm.image) {
        formData.append('image', webHeroForm.image);
      }

      if (webHeroForm.title.trim()) {
        formData.append('title', webHeroForm.title.trim());
      }

      formData.append(
        'sort_order',
        String(webHeroForm.sort_order)
      );
      formData.append(
        'publish_status',
        webHeroForm.publish_status
      );

      if (webHeroForm.starts_at) {
        formData.append('starts_at', webHeroForm.starts_at);
      }

      if (webHeroForm.ends_at) {
        formData.append('ends_at', webHeroForm.ends_at);
      }

      // Add always creates a new banner. Existing banners are only changed
      // through their individual Edit action.
      await createWebHeroBanner(formData);
      setWebHeroSuccess('Web Hero Banner added successfully.');
      resetWebHeroForm();
      await loadWebHeroBanners();
      return true;
    } catch (error) {
      console.error('WEB HERO BANNER CREATE ERROR:', error);
      setWebHeroError(
        error?.message || 'Unable to upload Web Hero Banner'
      );
      return false;
    } finally {
      setWebHeroSaving(false);
    }
  };

  const handleEditWebHeroBanner = async (bannerId, formData) => {
    try {
      setEditSaving(true);
      setWebHeroError('');
      setWebHeroSuccess('');

      await updateBanner(bannerId, formData);
      setWebHeroSuccess('Web Hero banner updated successfully.');
      setEditingBanner(null);
      await loadWebHeroBanners();
    } catch (error) {
      console.error('WEB HERO UPDATE ERROR:', error);
      setWebHeroError(
        error?.message || 'Unable to update Web Hero banner'
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteWebHeroBanner = async (bannerId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this Web Hero banner? This will also remove its image from Storage.'
    );

    if (!confirmed) return;

    try {
      setDeleteSaving(true);
      setDeleteBannerId(bannerId);
      setWebHeroError('');
      setWebHeroSuccess('');

      await deleteBanner(bannerId);
      setWebHeroSuccess('Web Hero banner deleted successfully.');
      await loadWebHeroBanners();
    } catch (error) {
      console.error('WEB HERO DELETE ERROR:', error);
      setWebHeroError(
        error?.message || 'Unable to delete Web Hero banner'
      );
    } finally {
      setDeleteSaving(false);
      setDeleteBannerId(null);
    }
  };

  const handleDeleteManagedBanner = async ({
    bannerId,
    label,
    reload,
    setError,
    setSuccess,
  }) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${label}? This will also remove its image from Storage.`
    );

    if (!confirmed) return false;

    try {
      setDeleteSaving(true);
      setDeleteBannerId(bannerId);
      setError('');
      setSuccess('');

      await deleteBanner(bannerId);
      const refreshed = await reload();

      if (refreshed !== false) {
        setSuccess(`${label} deleted successfully.`);
      }
      return true;
    } catch (error) {
      console.error(`${label.toUpperCase()} DELETE ERROR:`, error);
      setError(
        error?.message || `Unable to delete ${label.toLowerCase()}`
      );
      return false;
    } finally {
      setDeleteSaving(false);
      setDeleteBannerId(null);
    }
  };

  const handleDeleteAppBanner = (bannerId) =>
    handleDeleteManagedBanner({
      bannerId,
      label: 'App banner',
      reload: loadBanners,
      setError,
      setSuccess,
    });

  const handleDeleteCategoryBanner = async (bannerId) => {
    const deleted = await handleDeleteManagedBanner({
      bannerId,
      label: 'App category banner',
      reload: loadCategoryBanners,
      setError: setCategoryError,
      setSuccess: setCategorySuccess,
    });

    if (deleted && editingCategoryBannerId === bannerId) {
      resetCategoryForm();
    }
  };

  const handleDeleteShopByNeedBanner = (bannerId) =>
    handleDeleteManagedBanner({
      bannerId,
      label: 'Shop by Need banner',
      reload: loadShopByNeedImages,
      setError: setShopByNeedError,
      setSuccess: setShopByNeedSuccess,
    });

  const handleDeleteWebCategoryCampaign = (bannerId) =>
    handleDeleteManagedBanner({
      bannerId,
      label: 'Web category campaign',
      reload: loadWebCategoryCampaigns,
      setError: setCampaignError,
      setSuccess: setCampaignSuccess,
    });

  /* ==========================================================
     LOAD CATEGORIES
  ========================================================== */

  const loadCategories = async () => {
    try {
      const response = await getResource('categories');

      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
            ? response.data
            : [];

      setCategories(items);
    } catch (err) {
      console.error('CATEGORY LOAD ERROR:', err);

      setCategoryError(
        err.message || 'Unable to load categories'
      );
    }
  };

  const handleHeaderCategoryToggle = async (category) => {
    const showOnHome = !category.show_on_home;
    const visibleCategories = categories.filter(
      (item) => Boolean(item.show_on_home) && String(item.id) !== String(category.id)
    );
    const changes = {
      show_on_home: showOnHome,
      ...(showOnHome
        ? {
            home_sort_order:
              Math.max(
                0,
                ...visibleCategories.map((item) =>
                  Number(item.home_sort_order) || 0
                )
              ) + 1,
          }
        : {}),
    };

    setHeaderCategorySavingId(category.id);
    setHeaderCategoryError('');

    try {
      await updateCategorySettings(category.id, changes);
      setCategories((current) =>
        current.map((item) =>
          String(item.id) === String(category.id)
            ? { ...item, ...changes }
            : item
        )
      );
    } catch (requestError) {
      console.error('APP HEADER CATEGORY UPDATE ERROR:', requestError);
      setHeaderCategoryError(
        requestError.message || 'Unable to update app header categories.'
      );
    } finally {
      setHeaderCategorySavingId(null);
    }
  };

  const handleEditHeaderCategoryBanner = (category) => {
    setActiveHeaderCategoryId(String(category.id));
    setAppCategoryReturnToHome(true);
    setAppBannerReturnToHome(false);
    setBannerPlatform('app');
    setShowAppBannerTypes(false);
    setBannerType('category');
    removeCategoryImage();
    setCategoryForm({
      ...INITIAL_CATEGORY_FORM,
      category_id: String(category.id),
    });
    setEditingCategoryBannerId(null);
    setCategoryError('');
    setCategorySuccess('');
  };

  /* ==========================================================
     LOAD CATEGORY BANNERS
  ========================================================== */

  const loadCategoryBanners = async () => {
    try {
      setCategoryLoading(true);
      setCategoryError('');

      const response = await getCategoryBanners();

      setCategoryBanners(response?.items || []);
    } catch (err) {
      console.error(
        'CATEGORY BANNER LOAD ERROR:',
        err
      );

      setCategoryError(
        err.message ||
          'Unable to load category banners'
      );
    } finally {
      setCategoryLoading(false);
    }
  };

  /* ==========================================================
     LOAD CATEGORY CAMPAIGNS
  ========================================================== */

  const loadCategoryCampaigns = async () => {
    try {
      setCampaignLoading(true);
      setCampaignError('');

      const response = await getCategoryCampaigns({
        platform: bannerPlatform || 'app',
      });

      const items = Array.isArray(response)
        ? response
        : response?.items ||
          response?.data ||
          [];

      setCategoryCampaigns(items);
    } catch (error) {
      console.error(
        'CATEGORY CAMPAIGN LOAD ERROR:',
        error
      );

      setCampaignError(
        error?.message ||
          'Unable to load category campaigns'
      );
    } finally {
      setCampaignLoading(false);
    }
  };

  const loadWebCategoryCampaigns = async () => {
    try {
      setWebCategoryCampaignLoading(true);

      const response = await getWebCategoryCampaignBanners();

      console.log(
        'WEB CATEGORY CAMPAIGNS RESPONSE:',
        response
      );

      setWebCategoryCampaigns(
        Array.isArray(response?.items)
          ? response.items
          : []
      );
    } catch (error) {
      console.error(
        'WEB CATEGORY CAMPAIGNS LOAD ERROR:',
        error
      );
      setWebCategoryCampaigns([]);
    } finally {
      setWebCategoryCampaignLoading(false);
    }
  };

  const handleEditWebCategoryCampaign = async (bannerId, formData) => {
    try {
      setWebCategoryCampaignEditSaving(true);
      setCampaignError('');
      setCampaignSuccess('');
      await updateBanner(bannerId, formData);
      setEditingWebCategoryCampaign(null);
      await loadWebCategoryCampaigns();
      setCampaignSuccess('Web category campaign updated successfully.');
    } catch (error) {
      console.error('WEB CATEGORY CAMPAIGN UPDATE ERROR:', error);
      setCampaignError(
        error?.message || 'Unable to update Web category campaign'
      );
    } finally {
      setWebCategoryCampaignEditSaving(false);
    }
  };

  /* ==========================================================
     WEB CONTENT MANAGEMENT
  ========================================================== */

  const loadWebContentSections = async () => {
    try {
      setContentSectionsLoading(true);
      setContentSectionsError('');

      const getSections = (response) => {
        const sections =
          response?.data?.sections ??
          response?.sections ??
          response?.data ??
          [];
        return Array.isArray(sections) ? sections : [];
      };

      let sections = getSections(
        await getContentManagementSections('web', 'home')
      );
      setContentSections(sortWebHomeSections(sections));

      const existingKeys = new Set(
        sections.map(getWebSectionKey)
      );
      const missingSections = REQUIRED_WEB_HOME_SECTIONS.filter(
        (requiredSection) =>
          !requiredSection.keys.some((key) => existingKeys.has(key))
      );

      for (const section of missingSections) {
        try {
          await createContentManagementSection({
            platform: 'web',
            page_key: 'home',
            section_key: section.section_key,
            section_type: section.section_type,
            title: section.title,
            sort_order: section.sort_order,
            is_visible: true,
            publish_status: 'published',
            selection_mode: 'manual',
          });
        } catch (createError) {
          const latestSections = getSections(
            await getContentManagementSections('web', 'home')
          );
          const wasCreatedElsewhere = section.keys.some((key) =>
            latestSections.some(
              (existingSection) =>
                getWebSectionKey(existingSection) === key
            )
          );
          if (!wasCreatedElsewhere) {
            throw createError;
          }
        }
      }

      if (missingSections.length > 0) {
        sections = getSections(
          await getContentManagementSections('web', 'home')
        );
      }

      setContentSections(sortWebHomeSections(sections));
    } catch (error) {
      console.error(
        'WEB CONTENT SECTIONS LOAD ERROR:',
        error
      );

      setContentSectionsError(
        error?.message ||
          'Unable to load website content sections.'
      );
    } finally {
      setContentSectionsLoading(false);
    }
  };

  const loadAppHomeSections = async () => {
    try {
      setAppHomeSectionsLoading(true);
      setAppHomeSectionsError('');

      const getSections = (response) => {
        const sections =
          response?.data?.sections ??
          response?.sections ??
          response?.data ??
          [];
        return Array.isArray(sections) ? sections : [];
      };

      let sections = getSections(
        await getContentManagementSections('app', 'home')
      );
      const existingKeys = new Set(sections.map(getWebSectionKey));
      const missingSections = APP_HOME_SECTION_DEFAULTS.filter(
        (section) =>
          ![section.section_key, ...section.aliases].some((key) =>
            existingKeys.has(key)
          )
      );

      for (const section of missingSections) {
        try {
          await createContentManagementSection({
            platform: 'app',
            page_key: 'home',
            section_key: section.section_key,
            section_type: section.section_type,
            title: section.title,
            sort_order:
              APP_HOME_SECTION_DEFAULTS.findIndex(
                (item) => item.section_key === section.section_key
              ) + 1,
            is_visible: true,
            publish_status: 'published',
            selection_mode: 'manual',
          });
        } catch (createError) {
          const latestSections = getSections(
            await getContentManagementSections('app', 'home')
          );
          if (
            ![section.section_key, ...section.aliases].some((key) =>
              latestSections.some(
                (item) => getWebSectionKey(item) === key
              )
            )
          ) {
            throw createError;
          }
        }
      }

      if (missingSections.length > 0) {
        sections = getSections(
          await getContentManagementSections('app', 'home')
        );
      }

      setAppHomeSections(
        sections.filter((section) => {
          const key = getWebSectionKey(section);
          return (
            !isFixedNavbarSection(section) &&
            ![
              'app_wellness_bundles',
              'wellness_bundles',
              'bundles',
            ].includes(key)
          );
        })
      );
    } catch (error) {
      console.error('APP HOME SECTIONS LOAD ERROR:', error);
      setAppHomeSectionsError(
        error?.message || 'Unable to load app homepage sections.'
      );
    } finally {
      setAppHomeSectionsLoading(false);
    }
  };

  const handleAppHomeSectionDrop = async (targetSectionId) => {
    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      setDraggedSectionId(null);
      return;
    }

    const reordered = [...appHomeSections];
    const draggedIndex = reordered.findIndex(
      (section) => section.id === draggedSectionId
    );
    const targetIndex = reordered.findIndex(
      (section) => section.id === targetSectionId
    );
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedSectionId(null);
      return;
    }

    const [draggedSection] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedSection);
    const orderedSections = reordered.map((section, index) => ({
      ...section,
      sort_order: index + 1,
    }));

    setAppHomeSections(orderedSections);
    setAppHomeSectionsSaving(true);
    setAppHomeSectionsError('');
    try {
      await reorderContentManagementSections(orderedSections);
    } catch (error) {
      console.error('APP HOME SECTION REORDER ERROR:', error);
      setAppHomeSectionsError(
        error?.message || 'Unable to reorder app homepage sections.'
      );
      await loadAppHomeSections();
    } finally {
      setDraggedSectionId(null);
      setAppHomeSectionsSaving(false);
    }
  };

  const handleContentSectionDrop = async (targetSectionId) => {
    if (
      !draggedSectionId ||
      draggedSectionId === targetSectionId
    ) {
      setDraggedSectionId(null);
      return;
    }

    const reordered = contentSections.filter(
      (section) => !isFixedNavbarSection(section)
    );

    const draggedIndex = reordered.findIndex(
      (section) => section.id === draggedSectionId
    );

    const targetIndex = reordered.findIndex(
      (section) => section.id === targetSectionId
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedSectionId(null);
      return;
    }

    const [draggedSection] = reordered.splice(
      draggedIndex,
      1
    );

    reordered.splice(targetIndex, 0, draggedSection);

    const orderedSections = reordered.map(
      (section, index) => ({
        ...section,
        sort_order: index + 1,
      })
    );

    setContentSections((current) => [
      ...orderedSections,
      ...current.filter(isFixedNavbarSection),
    ]);
    setContentSectionsSaving(true);
    setContentSectionsError('');

    try {
      await reorderContentManagementSections(
        orderedSections
      );
    } catch (error) {
      console.error(
        'WEB CONTENT SECTION REORDER ERROR:',
        error
      );

      setContentSectionsError(
        error?.message ||
          'Unable to reorder sections.'
      );

      await loadWebContentSections();
    } finally {
      setDraggedSectionId(null);
      setContentSectionsSaving(false);
    }
  };

  /* ==========================================================
     WEB CONTENT SECTION EDITOR
  ========================================================== */

  const openEditContentSection = async (section) => {
    const action = getWebSectionAction(section);

    if (action === 'hero') {
      setBannerPlatform('web');
      setBannerType('hero');
      return;
    }

    if (action === 'main-promo') {
      setWebPromoReturnToHome(true);
      setBannerPlatform('web');
      setBannerType('promotional');
      return;
    }

    if (
      action === 'categories' ||
      action === 'category-campaigns' ||
      action === 'more-discovery'
    ) {
      await openContentSectionItems(section);
      return;
    }

    if (action !== 'shop-by-need') return;

    try {
      setContentSectionsSaving(true);
      setContentSectionEditorError('');
      const response = await getContentManagementSection(section.id);
      const loaded = response?.data?.section ?? response?.section ?? response;
      setEditingContentSection(loaded || section);
      setContentSectionEditorMode('edit');
      setContentSectionEditorOpen(true);
    } catch (error) {
      console.error('WEB CONTENT SECTION LOAD ERROR:', error);
      setContentSectionEditorError(
        error?.message || 'Unable to load section details.'
      );
    } finally {
      setContentSectionsSaving(false);
    }
  };

  const handleSaveContentSection = async (payload) => {
    try {
      setContentSectionEditorSaving(true);
      setContentSectionEditorError('');

      if (
        contentSectionEditorMode !== 'create' &&
        editingContentSection?.id
      ) {
        await updateContentManagementSection(
          editingContentSection.id,
          payload
        );
      } else {
        await createContentManagementSection({
          platform: 'web',
          page_key: 'home',
          ...payload,
        });
      }

      setContentSectionEditorOpen(false);
      setEditingContentSection(null);
      await loadWebContentSections();
    } catch (error) {
      console.error('WEB CONTENT SECTION SAVE ERROR:', error);
      setContentSectionEditorError(
        error?.message || 'Unable to save section.'
      );
    } finally {
      setContentSectionEditorSaving(false);
    }
  };

  /* ==========================================================
     WEB CONTENT ITEM EDITOR
  ========================================================== */

  const openContentSectionItems = async (section) => {
    try {
      setContentSectionsSaving(true);
      setContentSectionEditorError('');
      const response = await getContentManagementSection(section.id);
      const loaded = response?.data?.section ?? response?.section ?? response;
      setEditingContentSection(loaded || section);
      setContentSectionEditorMode('items');
      setContentSectionEditorOpen(true);
    } catch (error) {
      console.error('WEB CONTENT ITEMS LOAD ERROR:', error);
      setContentSectionEditorError(
        error?.message || 'Unable to load section content.'
      );
    } finally {
      setContentSectionsSaving(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadBanners();
    loadCategories();
    loadCategoryBanners();
    loadCategoryCampaigns();
  }, []);

  useEffect(() => {
    if (bannerPlatform === 'web' && bannerType === null) {
      loadWebContentSections();
    }
  }, [bannerPlatform, bannerType]);

  useEffect(() => {
    if (
      bannerPlatform === 'app' &&
      bannerType === null &&
      !showAppBannerTypes
    ) {
      loadAppHomeSections();
    }
  }, [bannerPlatform, bannerType, showAppBannerTypes]);

  useEffect(() => {
    if (bannerPlatform === 'web' && bannerType === 'hero') {
      Promise.resolve().then(loadWebHeroBanners);
    }
  }, [bannerPlatform, bannerType]);

  useEffect(() => {
    if (
      bannerPlatform === 'web' &&
      bannerType === 'shop-by-need'
    ) {
      Promise.resolve().then(loadShopByNeedImages);
    }
  }, [bannerPlatform, bannerType]);

  useEffect(() => {
    if (
      bannerPlatform === 'web' &&
      bannerType === 'promotional'
    ) {
      Promise.resolve().then(loadMainPromoBanners);
    }
  }, [bannerPlatform, bannerType]);

  useEffect(() => {
    if (
      bannerPlatform === 'web' &&
      bannerType === 'campaign'
    ) {
      Promise.resolve().then(loadWebCategoryCampaigns);
    }
  }, [bannerPlatform, bannerType]);

  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (categoryPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(categoryPreviewUrl);
      }

      if (campaignPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(campaignPreviewUrl);
      }

      if (webHeroPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(webHeroPreviewUrl);
      }
    };
  }, [
    previewUrl,
    categoryPreviewUrl,
    campaignPreviewUrl,
    webHeroPreviewUrl,
  ]);

  /* ==========================================================
     APP BANNER IMAGE VALIDATION
     APP = 7:3
  ========================================================== */

  const validateAppImage = (file) => {
    return new Promise((resolve) => {
      if (!file) {
        resolve(false);
        return;
      }

      const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/webp',
      ];

      if (!allowedTypes.includes(file.type)) {
        setError(
          'Only JPG, PNG, and WEBP images are allowed.'
        );
        resolve(false);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(
          'Banner image must be smaller than 10 MB.'
        );
        resolve(false);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        const ratio = image.width / image.height;
        const expectedRatio = 7 / 3;

        URL.revokeObjectURL(objectUrl);

        if (
          Math.abs(ratio - expectedRatio) >
          0.03
        ) {
          setError(
            `Invalid banner ratio. Please use a 7:3 image. Current image is ${image.width} × ${image.height}.`
          );

          resolve(false);
          return;
        }

        resolve(true);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        setError(
          'Unable to read the selected image.'
        );

        resolve(false);
      };

      image.src = objectUrl;
    });
  };

  /* ==========================================================
     APP BANNER IMAGE SELECTION
  ========================================================== */

  const selectImage = async (file) => {
    if (!file) return;

    setError('');
    setSuccess('');

    const valid = await validateAppImage(file);

    if (!valid) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl =
      URL.createObjectURL(file);

    setPreviewUrl(newPreviewUrl);

    setForm((current) => ({
      ...current,
      image: file,
    }));
  };

  const handleFileChange = (event) => {
    selectImage(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setDragActive(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      selectImage(file);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === 'display_order'
          ? Math.max(1, Number(value))
          : value,
    }));
  };

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl('');

    setForm((current) => ({
      ...current,
      image: null,
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    removeImage();

    setForm({
      ...INITIAL_FORM,
    });

    setError('');
  };

  /* ==========================================================
     CREATE APP BANNER
  ========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!form.image) {
      setError(
        'Please select a banner image.'
      );
      return;
    }

    if (!form.display_location) {
      setError(
        'Please select a display location.'
      );
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append(
        'image',
        form.image
      );

      formData.append(
        'platform',
        'app'
      );

      formData.append(
        'placement',
        'home'
      );

      formData.append(
        'display_location',
        form.display_location
      );

      formData.append(
        'display_order',
        String(form.display_order)
      );
      formData.append(
        'sort_order',
        String(form.display_order)
      );

      formData.append(
        'publish_status',
        form.publish_status
      );

      if (form.starts_at) {
        formData.append(
          'starts_at',
          form.starts_at
        );
      }

      if (form.ends_at) {
        formData.append(
          'ends_at',
          form.ends_at
        );
      }

      const existingAtPosition = banners.find(
        (banner) =>
          (banner.metadata?.display_location || 'Deals of the Week') ===
            form.display_location &&
          Number(banner.sort_order) === Number(form.display_order)
      );
      if (
        existingAtPosition &&
        !window.confirm(
          `A promotional banner already exists at position ${form.display_order}. Update that banner instead?`
        )
      ) {
        return;
      }

      if (existingAtPosition) {
        await updateBanner(existingAtPosition.id, formData);
        setSuccess('Existing promotional banner updated successfully.');
      } else {
        await createBanner(formData);
        setSuccess('Banner uploaded successfully.');
      }

      resetForm();

      await loadBanners();
    } catch (err) {
      console.error(
        'APP BANNER CREATE ERROR:',
        err
      );

      setError(
        err.message ||
          'Unable to create banner'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditAppBanner = async (bannerId, formData) => {
    try {
      setAppBannerEditSaving(true);
      setError('');
      setSuccess('');
      await updateBanner(bannerId, formData);
      setSuccess('App promotional banner updated successfully.');
      setEditingAppBanner(null);
      await loadBanners();
    } catch (err) {
      console.error('APP BANNER UPDATE ERROR:', err);
      setError(err?.message || 'Unable to update App promotional banner');
    } finally {
      setAppBannerEditSaving(false);
    }
  };

  /* ==========================================================
     CATEGORY BANNER IMAGE VALIDATION
     CATEGORY = 3:1
  ========================================================== */

  const validateCategoryImage = (file) => {
    return new Promise((resolve) => {
      if (!file) {
        resolve(false);
        return;
      }

      const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/webp',
      ];

      if (!allowedTypes.includes(file.type)) {
        setCategoryError(
          'Only JPG, PNG, and WEBP images are allowed.'
        );

        resolve(false);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setCategoryError(
          'Category banner image must be smaller than 10 MB.'
        );

        resolve(false);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        const ratio =
          image.width / image.height;

        const expectedRatio = 3 / 1;

        URL.revokeObjectURL(objectUrl);

        if (
          Math.abs(ratio - expectedRatio) >
          0.03
        ) {
          setCategoryError(
            `Invalid category banner ratio. Please use a 3:1 image. Current image is ${image.width} × ${image.height}.`
          );

          resolve(false);
          return;
        }

        resolve(true);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        setCategoryError(
          'Unable to read the selected image.'
        );

        resolve(false);
      };

      image.src = objectUrl;
    });
  };

  /* ==========================================================
     CATEGORY BANNER IMAGE SELECTION
  ========================================================== */

  const selectCategoryImage = async (file) => {
    if (!file) return;

    setCategoryError('');
    setCategorySuccess('');

    const valid =
      await validateCategoryImage(file);

    if (!valid) {
      return;
    }

    if (categoryPreviewUrl) {
      URL.revokeObjectURL(
        categoryPreviewUrl
      );
    }

    const newPreviewUrl =
      URL.createObjectURL(file);

    setCategoryPreviewUrl(
      newPreviewUrl
    );

    setCategoryForm((current) => ({
      ...current,
      image: file,
    }));
  };

  const handleCategoryFileChange = (
    event
  ) => {
    selectCategoryImage(
      event.target.files?.[0]
    );
  };

  const handleCategoryDrop = (
    event
  ) => {
    event.preventDefault();

    setCategoryDragActive(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      selectCategoryImage(file);
    }
  };

  const handleCategoryChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setCategoryForm((current) => ({
      ...current,
      [name]:
        name === 'display_order'
          ? Math.max(1, Number(value))
          : value,
    }));
  };

  const removeCategoryImage = () => {
    if (categoryPreviewUrl) {
      URL.revokeObjectURL(
        categoryPreviewUrl
      );
    }

    setCategoryPreviewUrl('');

    setCategoryForm((current) => ({
      ...current,
      image: null,
    }));

    if (
      categoryFileInputRef.current
    ) {
      categoryFileInputRef.current.value =
        '';
    }
  };

  const resetCategoryForm = () => {
    removeCategoryImage();

    setCategoryForm({
      ...INITIAL_CATEGORY_FORM,
      category_id: activeHeaderCategoryId || '',
    });

    setEditingCategoryBannerId(null);
    setCategoryError('');
  };

  /* ==========================================================
     CREATE CATEGORY BANNER
  ========================================================== */

  const handleCategorySubmit = async (
    event
  ) => {
    event.preventDefault();

    setCategoryError('');
    setCategorySuccess('');

    if (!categoryForm.category_id) {
      setCategoryError(
        'Please select a category.'
      );
      return;
    }

    if (!categoryForm.image && !editingCategoryBannerId) {
      setCategoryError(
        'Please select a category banner image.'
      );
      return;
    }

    try {
      setCategorySaving(true);

      const formData =
        new FormData();

      formData.append(
        'category_id',
        categoryForm.category_id
      );

      if (categoryForm.image) {
        formData.append('image', categoryForm.image);
      }

      formData.append('sort_order', String(categoryForm.display_order));

      formData.append(
        'publish_status',
        categoryForm.publish_status
      );
      formData.append(
        'is_visible',
        String(categoryForm.publish_status === 'published')
      );

      const existingAtPosition = categoryBanners.find(
        (banner) =>
          banner.category_id === categoryForm.category_id &&
          Number(banner.sort_order) === Number(categoryForm.display_order) &&
          String(banner.id) !== String(editingCategoryBannerId)
      );
      const updateId = existingAtPosition?.id || editingCategoryBannerId;

      if (
        existingAtPosition &&
        !window.confirm(
          `A ${existingAtPosition.categories?.name || 'category'} banner already exists at position ${categoryForm.display_order}. Update that banner instead?`
        )
      ) {
        return;
      }

      formData.append('starts_at', categoryForm.starts_at);
      formData.append('ends_at', categoryForm.ends_at);

      if (updateId) {
        await updateBanner(updateId, formData);
      } else {
        formData.append(
          'display_order',
          String(categoryForm.display_order)
        );
        await createCategoryBanner(formData);
      }

      setCategorySuccess(
        updateId
          ? 'Category banner updated successfully.'
          : 'Category banner uploaded successfully.'
      );

      resetCategoryForm();

      await loadCategoryBanners();
    } catch (err) {
      console.error(
        'CATEGORY BANNER CREATE ERROR:',
        err
      );

      setCategoryError(
        err.message ||
          'Unable to create category banner'
      );
    } finally {
      setCategorySaving(false);
    }
  };

  const handleEditCategoryBanner = (banner) => {
    setEditingCategoryBannerId(banner.id);
    setCategoryForm({
      category_id: banner.category_id || '',
      image: null,
      display_order: banner.sort_order ?? 1,
      publish_status: banner.publish_status || 'draft',
      starts_at: banner.starts_at?.slice(0, 16) || '',
      ends_at: banner.ends_at?.slice(0, 16) || '',
    });
    setCategoryPreviewUrl(banner.image_url || '');
    setCategoryError('');
    setCategorySuccess('');
  };

  /* ==========================================================
     CATEGORY CAMPAIGN FORM
  ========================================================== */

  const selectCampaignImage = (file) => {
    if (!file) return;

    setCampaignError('');
    setCampaignSuccess('');

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setCampaignError(
        'Only JPG, PNG, and WEBP images are allowed.'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setCampaignError(
        'Campaign image must be smaller than 10 MB.'
      );
      return;
    }

    if (campaignPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(campaignPreviewUrl);
    }

    setCampaignPreviewUrl(URL.createObjectURL(file));
    setCampaignForm((current) => ({
      ...current,
      image: file,
    }));
  };

  const handleCampaignFileChange = (event) => {
    selectCampaignImage(event.target.files?.[0]);
  };

  const handleCampaignChange = (event) => {
    const { name, value, type, checked } = event.target;

    setCampaignForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'sort_order'
            ? Math.max(1, Number(value))
            : value,
    }));
  };

  const removeCampaignImage = () => {
    if (campaignPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(campaignPreviewUrl);
    }

    setCampaignPreviewUrl('');
    setCampaignForm((current) => ({
      ...current,
      image: null,
    }));

    if (campaignFileInputRef.current) {
      campaignFileInputRef.current.value = '';
    }
  };

  const resetCampaignForm = () => {
    removeCampaignImage();
    setCampaignForm({
      title: '',
      category_id: '',
      image: null,
      sort_order: 1,
      is_active: true,
    });
    setEditingCampaignId(null);
    setCampaignError('');
  };

  const handleCampaignSubmit = async (event) => {
    event.preventDefault();
    setCampaignError('');
    setCampaignSuccess('');

    if (!campaignForm.title.trim()) {
      setCampaignError('Please enter a campaign title.');
      return;
    }

    if (!campaignForm.category_id) {
      setCampaignError('Please select a category.');
      return;
    }

    if (!editingCampaignId && !campaignForm.image) {
      setCampaignError('Please select a campaign image.');
      return;
    }

    try {
      setCampaignSaving(true);

      const platform = bannerPlatform || 'app';
      const existingAtPosition = categoryCampaigns.find(
        (campaign) =>
          campaign.category_id === campaignForm.category_id &&
          Number(campaign.sort_order) === Number(campaignForm.sort_order) &&
          String(campaign.id) !== String(editingCampaignId)
      );
      if (
        existingAtPosition &&
        !window.confirm(
          `A ${categories.find((category) => category.id === campaignForm.category_id)?.name || 'category'} campaign already exists at position ${campaignForm.sort_order}. Update that campaign instead?`
        )
      ) {
        return;
      }

      const updateId = existingAtPosition?.id || editingCampaignId;
      const formData = new FormData();
      formData.append('platform', platform);
      formData.append('title', campaignForm.title.trim());
      formData.append('category_id', campaignForm.category_id);
      formData.append(
        'display_order',
        String(campaignForm.sort_order)
      );
      formData.append('is_active', String(campaignForm.is_active));

      if (campaignForm.image) {
        formData.append('image', campaignForm.image);
      }

      if (updateId) {
        await updateCategoryCampaign(updateId, formData);
        setCampaignSuccess(
          'Category campaign updated successfully.'
        );
      } else {
        await createCategoryCampaign(formData);
        setCampaignSuccess(
          'Category campaign created successfully.'
        );
      }

      resetCampaignForm();
      await loadCategoryCampaigns();
    } catch (err) {
      console.error('CATEGORY CAMPAIGN SAVE ERROR:', err);
      setCampaignError(
        err.message || 'Unable to save category campaign'
      );
    } finally {
      setCampaignSaving(false);
    }
  };

  const handleEditCampaign = (campaign) => {
    if (campaignPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(campaignPreviewUrl);
    }

    setEditingCampaignId(campaign.id);
    setCampaignForm({
      title: campaign.title || '',
      category_id: campaign.category_id || '',
      image: null,
      sort_order: campaign.sort_order || 1,
      is_active: campaign.is_active !== false,
    });
    setCampaignPreviewUrl(campaign.image_url || '');
    setCampaignError('');
    setCampaignSuccess('');
  };

  const handleDeleteCampaign = async (campaign) => {
    if (!window.confirm(`Delete "${campaign.title}" campaign?`)) {
      return;
    }

    try {
      setCampaignError('');
      setCampaignSuccess('');

      await deleteCategoryCampaign(campaign.id, bannerPlatform || 'app');
      setCampaignSuccess(
        'Category campaign deleted successfully.'
      );

      if (editingCampaignId === campaign.id) {
        resetCampaignForm();
      }

      await loadCategoryCampaigns();
    } catch (err) {
      console.error('CATEGORY CAMPAIGN DELETE ERROR:', err);
      setCampaignError(
        err.message || 'Unable to delete category campaign'
      );
    }
  };

  /* ==========================================================
     STATS
  ========================================================== */

  const publishedCount =
    banners.filter(
      (banner) =>
        banner.publish_status ===
        'published'
    ).length;

  const draftCount =
    banners.filter(
      (banner) =>
        banner.publish_status ===
        'draft'
    ).length;

  /* ==========================================================
     STATUS STYLE
  ========================================================== */

  const getStatusStyle = (status) => {
    if (status === 'published') {
      return {
        background: '#E8F5EC',
        color: '#17663D',
        border: '#C8E5D2',
      };
    }

    if (status === 'archived') {
      return {
        background: '#F3F3F0',
        color: '#6B6A64',
        border: '#DFDED8',
      };
    }

    return {
      background: '#FFF7E6',
      color: '#9A6910',
      border: '#F1DCA8',
    };
  };

  /* ==========================================================
     NAVIGATION HELPERS
  ========================================================== */

  const goBackToPlatforms = () => {
    setBannerPlatform(null);
    setBannerType(null);
    setShowAppBannerTypes(false);
    setAppBannerReturnToHome(false);
    setWebPromoReturnToHome(false);
    setAppCampaignReturnToHome(false);
    setAppCategoryReturnToHome(false);
    setActiveHeaderCategoryId(null);
  };

  const goBackToBannerTypes = () => {
    setBannerType(null);
  };

  const goBackFromAppCategoryBanner = () => {
    if (appCategoryReturnToHome) {
      setBannerType(null);
      setAppCategoryReturnToHome(false);
      setActiveHeaderCategoryId(null);
      return;
    }

    goBackToBannerTypes();
  };

  const currentBannerTypes =
    bannerPlatform === 'app'
      ? APP_BANNER_TYPES
      : WEB_BANNER_TYPES;

  const selectedBannerType =
    currentBannerTypes.find(
      (item) =>
        item.id === bannerType
    );

  const currentMainPromoBanner = mainPromoBanners.find((banner) => {
    if (
      banner.is_visible === false ||
      banner.publish_status !== 'published'
    ) {
      return false;
    }

    const now = currentTime;
    return (
      (!banner.starts_at || Date.parse(banner.starts_at) <= now) &&
      (!banner.ends_at || Date.parse(banner.ends_at) > now)
    );
  });

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className="content-management-page"
      style={{
        minHeight: '100%',
        paddingBottom: 40,
      }}
    >
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div
        className="content-management-page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div>
          <div
            className="content-management-eyebrow"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 11px',
              borderRadius: 999,
              background: '#F3F7F1',
              border: '1px solid #DCE8D9',
              color: '#276345',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            <Images size={13} />
            Content Management
          </div>

          <h1
            className="content-management-title"
            style={{
              margin: 0,
              fontSize: 30,
              lineHeight: 1.15,
              color: '#123D2B',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            {bannerPlatform === null
              ? 'Content Management'
              : bannerType === null
                ? bannerPlatform === 'app'
                  ? 'Mobile App'
                  : 'Customer Web'
                : selectedBannerType
                    ?.title ||
                  'Content Management'}
          </h1>

          <p
            className="content-management-description"
            style={{
              margin: '8px 0 0',
              color: '#716F68',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {bannerPlatform === null
              ? 'Manage and customize content for your customer platforms.'
              : bannerType === null
                ? `Manage ${
                    bannerPlatform === 'app'
                      ? 'customer mobile app'
                      : 'customer website'
                  } content.`
                : selectedBannerType
                    ?.description ||
                  ''}
          </p>
        </div>
      </div>

      {/* ======================================================
          PLATFORM SELECTION
      ====================================================== */}

      {bannerPlatform === null && (
        <PlatformSelection
          onSelect={(platform) => {
            setBannerPlatform(platform);
            setBannerType(null);
            setShowAppBannerTypes(false);
          }}
        />
      )}

      {/* ======================================================
          BANNER TYPE SELECTION
      ====================================================== */}

      {bannerPlatform !== null &&
        bannerType === null &&
        (bannerPlatform === 'web' ? (
          <WebHomeSections
            sections={contentSections}
            loading={contentSectionsLoading}
            saving={contentSectionsSaving}
            error={contentSectionsError}
            onBack={goBackToPlatforms}
            onEdit={openEditContentSection}
            onDragStart={setDraggedSectionId}
            onDrop={handleContentSectionDrop}
          />
        ) : showAppBannerTypes ? (
          <BannerTypeSelection
            platform={bannerPlatform}
            types={APP_BANNER_TYPES}
            onBack={() => setShowAppBannerTypes(false)}
            onSelect={(type) => {
              setAppBannerReturnToHome(false);
              setAppCampaignReturnToHome(false);
              setBannerType(type);
            }}
          />
        ) : (
          <AppHomeSections
            sections={appHomeSections}
            categories={categories}
            categoryBanners={categoryBanners}
            loading={appHomeSectionsLoading}
            saving={appHomeSectionsSaving}
            error={appHomeSectionsError}
            headerCategorySavingId={headerCategorySavingId}
            headerCategoryError={headerCategoryError}
            onBack={goBackToPlatforms}
            onToggleHeaderCategory={handleHeaderCategoryToggle}
            onEditHeaderCategoryBanner={handleEditHeaderCategoryBanner}
            onManageDeals={() => {
              setAppBannerReturnToHome(true);
              setAppCampaignReturnToHome(false);
              setBannerType('promotional');
            }}
            onManageCampaigns={() => {
              setAppCampaignReturnToHome(true);
              setAppBannerReturnToHome(false);
              setBannerType('campaign');
            }}
            onDragStart={setDraggedSectionId}
            onDrop={handleAppHomeSectionDrop}
          />
        ))}

      <ContentSectionEditor
        open={contentSectionEditorOpen}
        mode={contentSectionEditorMode}
        section={editingContentSection}
        categories={categories}
        saving={contentSectionEditorSaving}
        error={contentSectionEditorError}
        onClose={() => {
          setContentSectionEditorOpen(false);
          setEditingContentSection(null);
          setContentSectionEditorError('');
        }}
        onSave={handleSaveContentSection}
        onItemsSaved={async () => {
          setContentSectionEditorOpen(false);
          setEditingContentSection(null);
          await loadWebContentSections();
        }}
        onCreateItem={async (sectionId, payload, shouldRefresh = true) => {
          await createContentManagementItem(sectionId, payload);
          if (shouldRefresh) {
            const response = await getContentManagementSection(sectionId);
            const loaded = response?.data?.section ?? response?.section ?? response;
            setEditingContentSection(loaded);
          }
        }}
        onUpdateItem={async (itemId, payload, shouldRefresh = true) => {
          await updateContentManagementItem(itemId, payload);
          if (shouldRefresh && editingContentSection?.id) {
            const response = await getContentManagementSection(editingContentSection.id);
            const loaded = response?.data?.section ?? response?.section ?? response;
            setEditingContentSection(loaded);
          }
        }}
        onDeleteItem={async (
          itemId,
          shouldConfirm = true,
          shouldRefresh = true
        ) => {
          if (
            shouldConfirm &&
            !window.confirm('Are you sure you want to delete this content item?')
          ) {
            return false;
          }
          await deleteContentManagementItem(itemId);
          if (shouldRefresh && editingContentSection?.id) {
            const response = await getContentManagementSection(editingContentSection.id);
            const loaded = response?.data?.section ?? response?.section ?? response;
            setEditingContentSection(loaded);
          }
          return true;
        }}
      />

      {/* ======================================================
          APP PROMOTIONAL BANNERS
          7:3
      ====================================================== */}

      {bannerPlatform === 'app' &&
        bannerType === 'promotional' && (
          <SectionEditorWorkspace>
            <BackButton
              label={
                appBannerReturnToHome
                  ? 'Back to Home Sections'
                  : 'Back to App Banner Types'
              }
              onClick={() => {
                if (appBannerReturnToHome) {
                  setBannerType(null);
                  setAppBannerReturnToHome(false);
                  return;
                }
                goBackToBannerTypes();
              }}
            />

            <AppBannerManagement
              banners={banners}
              loading={loading}
              saving={saving}
              error={error}
              success={success}
              previewUrl={previewUrl}
              dragActive={dragActive}
              setDragActive={setDragActive}
              fileInputRef={fileInputRef}
              form={form}
              setForm={setForm}
              handleFileChange={
                handleFileChange
              }
              handleDrop={handleDrop}
              handleChange={handleChange}
              removeImage={removeImage}
              resetForm={resetForm}
              handleSubmit={handleSubmit}
              onStartEdit={setEditingAppBanner}
              editingBanner={editingAppBanner}
              editSaving={appBannerEditSaving}
              onCloseEdit={() => setEditingAppBanner(null)}
              onEditBanner={handleEditAppBanner}
              onDeleteBanner={handleDeleteAppBanner}
              deleteSaving={deleteSaving}
              deleteBannerId={deleteBannerId}
              publishedCount={
                publishedCount
              }
              draftCount={draftCount}
              getStatusStyle={
                getStatusStyle
              }
            />
          </SectionEditorWorkspace>
        )}

      {/* ======================================================
          APP CATEGORY BANNERS
          3:1
      ====================================================== */}

      {bannerPlatform === 'app' &&
        bannerType === 'category' && (
          <SectionEditorWorkspace>
            <BackButton
              label={
                appCategoryReturnToHome
                  ? 'Back to Header Categories'
                  : 'Back to App Banner Types'
              }
              onClick={goBackFromAppCategoryBanner}
            />

            <CategoryBannerManagement
              categories={
                activeHeaderCategoryId
                  ? categories.filter(
                      (category) =>
                        String(category.id) === activeHeaderCategoryId
                    )
                  : categories
              }
              categoryBanners={
                activeHeaderCategoryId
                  ? categoryBanners.filter(
                      (banner) =>
                        String(banner.category_id) === activeHeaderCategoryId
                    )
                  : categoryBanners
              }
              lockedCategoryId={activeHeaderCategoryId}
              categoryLoading={
                categoryLoading
              }
              categorySaving={
                categorySaving
              }
              categoryError={
                categoryError
              }
              categorySuccess={
                categorySuccess
              }
              categoryPreviewUrl={
                categoryPreviewUrl
              }
              categoryDragActive={
                categoryDragActive
              }
              setCategoryDragActive={
                setCategoryDragActive
              }
              categoryFileInputRef={
                categoryFileInputRef
              }
              categoryForm={
                categoryForm
              }
              setCategoryForm={
                setCategoryForm
              }
              handleCategoryFileChange={
                handleCategoryFileChange
              }
              handleCategoryDrop={
                handleCategoryDrop
              }
              handleCategoryChange={
                handleCategoryChange
              }
              removeCategoryImage={
                removeCategoryImage
              }
              resetCategoryForm={
                resetCategoryForm
              }
              handleCategorySubmit={
                handleCategorySubmit
              }
              editingCategoryBannerId={editingCategoryBannerId}
              onEditCategoryBanner={handleEditCategoryBanner}
              onDeleteCategoryBanner={handleDeleteCategoryBanner}
              deleteSaving={deleteSaving}
              deleteBannerId={deleteBannerId}
              getStatusStyle={
                getStatusStyle
              }
            />
          </SectionEditorWorkspace>
        )}

      {/* ======================================================
          APP CATEGORY CAMPAIGNS
      ====================================================== */}

      {bannerPlatform === 'app' &&
        bannerType === 'campaign' && (
          <SectionEditorWorkspace>
            <BackButton
              label={
                appCampaignReturnToHome
                  ? 'Back to Home Sections'
                  : 'Back to App Banner Types'
              }
              onClick={() => {
                if (appCampaignReturnToHome) {
                  setBannerType(null);
                  setAppCampaignReturnToHome(false);
                  return;
                }
                goBackToBannerTypes();
              }}
            />

            <CategoryCampaignManagement
              categories={categories}
              campaigns={categoryCampaigns}
              loading={campaignLoading}
              saving={campaignSaving}
              error={campaignError}
              success={campaignSuccess}
              form={campaignForm}
              previewUrl={campaignPreviewUrl}
              editingId={editingCampaignId}
              fileInputRef={campaignFileInputRef}
              handleChange={handleCampaignChange}
              handleFileChange={handleCampaignFileChange}
              handleSubmit={handleCampaignSubmit}
              removeImage={removeCampaignImage}
              resetForm={resetCampaignForm}
              onEdit={handleEditCampaign}
              onDelete={handleDeleteCampaign}
            />
          </SectionEditorWorkspace>
        )}

      {bannerPlatform === 'web' &&
        bannerType === 'campaign' && (
          <>
            <BackButton
              label="Back to Home Sections"
              onClick={goBackToBannerTypes}
            />

            <section
              style={{
                padding: 22,
                background: '#FFFFFF',
                border: '1px solid #E2E7DF',
                borderRadius: 18,
                boxShadow: '0 8px 28px rgba(18,61,43,0.05)',
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <h3
                  style={{
                    margin: 0,
                    color: '#123D2B',
                    fontSize: 18,
                  }}
                >
                  Web Category Campaigns
                </h3>
                <p
                  style={{
                    margin: '6px 0 0',
                    color: '#77746C',
                    fontSize: 13,
                  }}
                >
                  Category campaign banners used on the customer website.
                </p>
              </div>

              {webCategoryCampaignLoading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#77746C',
                  }}
                >
                  <Loader2 className="spin" size={20} />
                  Loading Web Category Campaigns...
                </div>
              ) : webCategoryCampaigns.length === 0 ? (
                <EmptyState
                  title="No Web Category Campaigns found"
                  description="No campaigns are currently available for the website."
                />
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 18,
                  }}
                >
                  {webCategoryCampaigns.map((campaign) => (
                    <article
                      key={campaign.id || campaign.storage_path}
                      style={{
                        overflow: 'hidden',
                        border: '1px solid #E2E7DF',
                        borderRadius: 14,
                        background: '#FFFFFF',
                      }}
                    >
                      <img
                        src={campaign.image_url}
                        alt={campaign.title || campaign.name || 'Category campaign'}
                        style={{
                          display: 'block',
                          width: '100%',
                          aspectRatio: '16 / 9',
                          objectFit: 'cover',
                          background: '#F3F4F0',
                        }}
                      />
                      <div
                        style={{
                          display: 'grid',
                          gap: 6,
                          padding: 14,
                        }}
                      >
                        <strong
                          style={{
                            color: '#123D2B',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {campaign.title || campaign.name}
                        </strong>
                        {(campaign.category_name ||
                          campaign.categories?.name) && (
                          <span
                            style={{
                              color: '#77746C',
                              fontSize: 12,
                            }}
                          >
                            {campaign.category_name ||
                              campaign.categories?.name}
                          </span>
                        )}
                        {campaign.storage_path && (
                          <span
                            style={{
                              color: '#77746C',
                              fontSize: 11,
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {campaign.storage_path}
                          </span>
                        )}
                        {campaign.id && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => setEditingWebCategoryCampaign(campaign)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteWebCategoryCampaign(campaign.id)
                              }
                              disabled={
                                deleteSaving &&
                                deleteBannerId === campaign.id
                              }
                              style={deleteButtonStyle}
                            >
                              {deleteSaving &&
                              deleteBannerId === campaign.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            {campaignError && (
              <Alert type="error" message={campaignError} />
            )}
            {campaignSuccess && (
              <Alert type="success" message={campaignSuccess} />
            )}
            {editingWebCategoryCampaign && (
              <WebMainPromoEditModal
                key={editingWebCategoryCampaign.id}
                banner={editingWebCategoryCampaign}
                saving={webCategoryCampaignEditSaving}
                bannerLabel="Web Category Campaign"
                validateRatio={false}
                previewAspectRatio="16 / 9"
                onClose={() => setEditingWebCategoryCampaign(null)}
                onSave={handleEditWebCategoryCampaign}
              />
            )}
          </>
        )}

      {/* ======================================================
          APP OTHER TYPES
      ====================================================== */}

      {bannerPlatform === 'app' &&
        bannerType !== null &&
        bannerType !== 'promotional' &&
        bannerType !== 'category' &&
        bannerType !== 'campaign' && (
          <>
            <BackButton
              label="Back to App Banner Types"
              onClick={goBackToBannerTypes}
            />

            <ComingSoon
              title={
                selectedBannerType?.title
              }
              description={
                selectedBannerType
                  ?.description
              }
            />
          </>
        )}

      {/* ======================================================
          WEB TYPES
      ====================================================== */}

      {bannerPlatform === 'web' &&
        bannerType === 'shop-by-need' && (
          <>
            <BackButton
              label="Back to Web Banner Types"
              onClick={goBackToBannerTypes}
            />
            <section
              style={{
                padding: 22,
                background: '#FFFFFF',
                border: '1px solid #E2E7DF',
                borderRadius: 18,
                boxShadow: '0 8px 28px rgba(18,61,43,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: '#123D2B',
                      fontSize: 20,
                    }}
                  >
                    Shop by Need
                  </h2>
                  <p
                    style={{
                      margin: '6px 0 0',
                      color: '#77746C',
                      fontSize: 13,
                    }}
                  >
                    Existing images in site_assets/shop-by-need.
                  </p>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleSyncShopByNeed}
                    disabled={shopByNeedLoading || shopByNeedCreateSaving}
                  >
                    {shopByNeedLoading ? (
                      <>
                        <Loader2 className="spin" size={16} />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Images size={16} />
                        Sync Existing Images
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setShopByNeedError('');
                      setShowShopByNeedCreate(true);
                    }}
                    disabled={shopByNeedCreateSaving}
                  >
                    <ImagePlus size={17} />
                    Add Shop by Need
                  </button>
                </div>
              </div>

              {shopByNeedError && (
                <Alert
                  type="error"
                  message={shopByNeedError}
                />
              )}
              {shopByNeedSuccess && (
                <Alert
                  type="success"
                  message={shopByNeedSuccess}
                />
              )}

              {shopByNeedLoading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#77746C',
                  }}
                >
                  <Loader2 className="spin" size={20} />
                  Loading Shop by Need images...
                </div>
              ) : shopByNeedImages.length === 0 ? (
                <EmptyState
                  title="No Shop by Need images found"
                  description="No images were found in the Shop by Need storage folder."
                />
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 18,
                  }}
                >
                  {shopByNeedImages.map((item) => (
                    <article
                      key={item.storage_path}
                      style={{
                        overflow: 'hidden',
                        border: '1px solid #E2E7DF',
                        borderRadius: 14,
                        background: '#FFFFFF',
                      }}
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{
                          display: 'block',
                          width: '100%',
                          aspectRatio: '16 / 9',
                          objectFit: 'cover',
                          background: '#F3F4F0',
                        }}
                      />
                      <div
                        style={{
                          display: 'grid',
                          gap: 6,
                          padding: 14,
                        }}
                      >
                        <strong
                          style={{
                            color: '#123D2B',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {item.name}
                        </strong>
                        <span
                          style={{
                            color: '#77746C',
                            fontSize: 11,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {item.storage_path}
                        </span>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={!item.id || shopByNeedEditSaving}
                          title={
                            item.id
                              ? 'Edit this Shop by Need banner'
                              : 'Sync existing images to enable editing'
                          }
                          onClick={() => item.id && setEditingShopByNeed(item)}
                        >
                          Edit
                        </button>
                        {item.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteShopByNeedBanner(item.id)}
                            disabled={
                              deleteSaving &&
                              deleteBannerId === item.id
                            }
                            style={deleteButtonStyle}
                          >
                            {deleteSaving &&
                            deleteBannerId === item.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            {editingShopByNeed && (
              <WebMainPromoEditModal
                key={editingShopByNeed.id}
                banner={editingShopByNeed}
                saving={shopByNeedEditSaving}
                bannerLabel="Shop by Need Banner"
                validateRatio={false}
                previewAspectRatio="16 / 9"
                onClose={() => setEditingShopByNeed(null)}
                onSave={handleEditShopByNeed}
              />
            )}
            {showShopByNeedCreate && (
              <WebShopByNeedCreateModal
                saving={shopByNeedCreateSaving}
                error={shopByNeedError}
                onClose={() => setShowShopByNeedCreate(false)}
                onSave={handleCreateShopByNeed}
              />
            )}
          </>
        )}

      {bannerPlatform === 'web' &&
        bannerType === 'hero' && (
          <>
            <BackButton
              label="Back to Web Banner Types"
              onClick={goBackToBannerTypes}
            />
            <WebHeroBannerManagement
              banners={webHeroBanners}
              loading={webHeroLoading}
              error={webHeroError}
              success={webHeroSuccess}
              saving={webHeroSaving}
              form={webHeroForm}
              previewUrl={webHeroPreviewUrl}
              dragActive={webHeroDragActive}
              setDragActive={setWebHeroDragActive}
              fileInputRef={webHeroFileInputRef}
              handleFileChange={handleWebHeroImageChange}
              handleDrop={handleWebHeroImageDrop}
              handleChange={handleWebHeroFormChange}
              removeImage={removeWebHeroImage}
              resetForm={resetWebHeroForm}
              handleSubmit={handleWebHeroSubmit}
              getStatusStyle={getStatusStyle}
              editingBanner={editingBanner}
              editSaving={editSaving}
              deleteSaving={deleteSaving}
              deleteBannerId={deleteBannerId}
              onEditBanner={handleEditWebHeroBanner}
              onDeleteBanner={handleDeleteWebHeroBanner}
              onCloseEdit={() => setEditingBanner(null)}
              onStartEdit={setEditingBanner}
            />
          </>
        )}

      {bannerPlatform === 'web' &&
        bannerType === 'promotional' && (
          <>
            <BackButton
              label={
                webPromoReturnToHome
                  ? 'Back to Home Sections'
                  : 'Back to Web Banner Types'
              }
              onClick={() => {
                if (webPromoReturnToHome) {
                  setBannerType(null);
                  setWebPromoReturnToHome(false);
                  return;
                }
                goBackToBannerTypes();
              }}
            />
            <section
              style={{
                padding: 22,
                background: '#FFFFFF',
                border: '1px solid #E2E7DF',
                borderRadius: 18,
                boxShadow: '0 8px 28px rgba(18,61,43,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: '#123D2B',
                      fontSize: 18,
                    }}
                  >
                    Daily Wellness Banner
                  </h3>
                  <p
                    style={{
                      margin: '6px 0 0',
                      color: '#77746C',
                      fontSize: 13,
                    }}
                  >
                    Change the banner image and its text. Other homepage sections are unchanged.
                  </p>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    gap: 8,
                  }}
                >
                  {!currentMainPromoBanner && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        setMainPromoError('');
                        setShowMainPromoCreate(true);
                      }}
                      disabled={mainPromoCreateSaving}
                    >
                      <ImagePlus size={17} />
                      Add Banner
                    </button>
                  )}
                </div>
              </div>

              {mainPromoError && (
                <Alert type="error" message={mainPromoError} />
              )}
              {mainPromoSuccess && (
                <Alert type="success" message={mainPromoSuccess} />
              )}

              {mainPromoLoading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#77746C',
                  }}
                >
                  <Loader2 className="spin" size={20} />
                  Loading Main Promo Banners...
                </div>
              ) : !currentMainPromoBanner ? (
                <EmptyState
                  title="No active Daily Wellness banner"
                  description="Add a banner image and text to connect this homepage section to the admin controls."
                />
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 18,
                  }}
                >
                  {[currentMainPromoBanner].map((banner) => (
                    <article
                      key={banner.id}
                      style={{
                        overflow: 'hidden',
                        border: '1px solid #E2E7DF',
                        borderRadius: 14,
                        background: '#FFFFFF',
                      }}
                    >
                      <img
                        src={banner.image_url}
                        alt={banner.title || 'Main Promo Banner'}
                        style={{
                          display: 'block',
                          width: '100%',
                          aspectRatio: '16 / 9',
                          objectFit: 'cover',
                          background: '#F3F4F0',
                        }}
                      />
                      <div
                        style={{
                          display: 'grid',
                          gap: 6,
                          padding: 14,
                        }}
                      >
                        <strong
                          style={{
                            color: '#123D2B',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {banner.title || 'Untitled Main Promo Banner'}
                        </strong>
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setEditingMainPromo(banner)}
                          >
                            Edit Banner and Text
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            {editingMainPromo && (
              <WebMainPromoEditModal
                key={editingMainPromo.id}
                banner={editingMainPromo}
                saving={mainPromoEditSaving}
                contentOnly
                onClose={() => setEditingMainPromo(null)}
                onSave={handleEditMainPromo}
              />
            )}
            {showMainPromoCreate && (
              <WebMainPromoCreateModal
                saving={mainPromoCreateSaving}
                error={mainPromoError}
                onClose={() => setShowMainPromoCreate(false)}
                onSave={handleCreateMainPromo}
              />
            )}
          </>
        )}

      {bannerPlatform === 'web' &&
        bannerType !== null &&
        bannerType !== 'hero' &&
        bannerType !== 'shop-by-need' &&
        bannerType !== 'promotional' &&
        bannerType !== 'campaign' && (
          <>
            <BackButton
              label="Back to Web Banner Types"
              onClick={goBackToBannerTypes}
            />

            <ComingSoon
              title={
                selectedBannerType?.title
              }
              description={
                selectedBannerType
                  ?.description
              }
            />
          </>
        )}

      {/* ======================================================
          ANIMATIONS
      ====================================================== */}

      <style>
        {`
          @keyframes banner-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

function WebHeroBannerManagement({
  banners,
  loading,
  error,
  success,
  saving,
  form,
  previewUrl,
  dragActive,
  setDragActive,
  fileInputRef,
  handleFileChange,
  handleDrop,
  handleChange,
  handleSubmit,
  removeImage,
  resetForm,
  getStatusStyle,
  editingBanner,
  editSaving,
  deleteSaving,
  deleteBannerId,
  onEditBanner,
  onDeleteBanner,
  onCloseEdit,
  onStartEdit,
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleOpenAdd = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleCloseAdd = () => {
    resetForm();
    setShowAddForm(false);
  };

  const handleAddSubmit = async (event) => {
    const saved = await handleSubmit(event);
    if (saved) {
      setShowAddForm(false);
    }
  };

  return (
    <>
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <ExistingBanners
        banners={banners}
        loading={loading}
        getStatusStyle={getStatusStyle}
        onEdit={onStartEdit}
        onDelete={onDeleteBanner}
        deleteSaving={deleteSaving}
        deleteBannerId={deleteBannerId}
        title="Web Hero Banners"
        description="Manage the banners currently displayed in the customer website hero carousel."
        emptyTitle="No Web Hero banners yet"
        emptyDescription="Add your first website hero banner."
        bannerFallback="Web Hero Banner"
        subtitleFallback="AUMVEDA Website"
        headerAction={
          <button
            type="button"
            onClick={handleOpenAdd}
            disabled={saving}
            style={{
              border: 'none',
              borderRadius: 9,
              padding: '9px 13px',
              background: '#123D2B',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.65 : 1,
            }}
          >
            + Add Banner
          </button>
        }
      />

      {showAddForm && (
        <section
          style={{
            marginTop: 18,
            background: '#FFFFFF',
            border: '1px solid #E2E7DF',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 8px 28px rgba(18,61,43,0.05)',
          }}
        >
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid #EDF0EB',
              background: 'linear-gradient(135deg, #FBFCFA 0%, #F5F8F3 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#123D2B' }}>
                Add Web Hero Banner
              </h2>
              <p style={{ margin: '4px 0 0', color: '#77746C', fontSize: 12 }}>
                Add a new 4.4:1 banner without replacing existing banners.
              </p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={handleCloseAdd}
              disabled={saving}
              aria-label="Close add banner"
            >
              <X size={17} />
            </button>
          </div>

          <form onSubmit={handleAddSubmit}>
            <div style={{ padding: 22 }}>
              <ImageUploadBox
                previewUrl={previewUrl}
                file={form.image}
                dragActive={dragActive}
                setDragActive={setDragActive}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                handleDrop={handleDrop}
                removeImage={removeImage}
                ratioText="JPG · PNG · WEBP · 4.4:1 ratio · Max 10 MB · Optional if banner text is provided"
              />

              <div style={{ marginTop: 16 }}>
                <FormField label="Banner Text / Title">
                  <input
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Optional text when no image is used"
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <FormField label="Display Order" required>
                  <input
                    name="sort_order"
                    type="number"
                    min="1"
                    value={form.sort_order}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Status" required>
                  <select
                    name="publish_status"
                    value={form.publish_status}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {capitalize(status)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Start Date">
                  <input
                    name="starts_at"
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="End Date">
                  <input
                    name="ends_at"
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <FormActions
                saving={saving}
                onClear={handleCloseAdd}
                saveText="Save Banner"
              />
            </div>
          </form>
        </section>
      )}

      {editingBanner && (
        <WebHeroEditModal
          key={editingBanner.id}
          banner={editingBanner}
          saving={editSaving}
          onClose={onCloseEdit}
          onSave={onEditBanner}
        />
      )}
    </>
  );
}

function WebHeroEditModal({
  banner,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    title: banner.title || '',
    target_type: banner.target_type || 'home',
    target_id: banner.target_id || '',
    target_url: banner.target_url || '',
    sort_order: banner.sort_order ?? 0,
    is_visible: banner.is_visible !== false,
    publish_status: banner.publish_status || 'draft',
    starts_at: banner.starts_at
      ? banner.starts_at.slice(0, 16)
      : '',
    ends_at: banner.ends_at
      ? banner.ends_at.slice(0, 16)
      : '',
    image: null,
  });
  const [previewUrl, setPreviewUrl] = useState(
    banner.image_url || ''
  );
  const [imageError, setImageError] = useState('');
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]:
        name === 'sort_order'
          ? Math.max(0, Number(value))
          : name === 'is_visible'
            ? value === 'true'
            : value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError('');

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setImageError('Only JPG, PNG, and WEBP images are allowed.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError('Banner image must be smaller than 10 MB.');
      event.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (Math.abs(image.width / image.height - 4.4) > 0.03) {
        URL.revokeObjectURL(objectUrl);
        setImageError(
          `Please use a 4.4:1 image. Current image is ${image.width} × ${image.height}.`
        );
        event.target.value = '';
        return;
      }

      setPreviewUrl(objectUrl);
      setForm((current) => ({
        ...current,
        image: file,
      }));
      setRemoveExistingImage(false);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setImageError('Unable to read the selected image.');
      event.target.value = '';
    };
    image.src = objectUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();

    formData.append('title', form.title);
    formData.append('target_type', form.target_type);
    formData.append('target_id', form.target_id);
    formData.append('target_url', form.target_url);
    formData.append('sort_order', String(form.sort_order));
    formData.append('is_visible', String(form.is_visible));
    formData.append('publish_status', form.publish_status);
    formData.append('starts_at', form.starts_at);
    formData.append('ends_at', form.ends_at);

    if (form.image) {
      formData.append('image', form.image);
    }
    if (removeExistingImage) {
      formData.append('remove_image', 'true');
    }

    await onSave(banner.id, formData);
  };

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(15,35,25,0.48)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="web-hero-edit-title"
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 18,
          background: '#FFFFFF',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              id="web-hero-edit-title"
              style={{ margin: 0, color: '#123D2B', fontSize: 20 }}
            >
              Edit Web Hero Banner
            </h2>
            <p style={{ margin: '6px 0 0', color: '#77746C', fontSize: 13 }}>
              Update the banner image or text. The existing image can be kept.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit dialog"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={form.title || 'Hero banner preview'}
              style={{
                display: 'block',
                width: '100%',
                aspectRatio: '4.4 / 1',
                objectFit: 'cover',
                borderRadius: 12,
                background: '#F3F4F0',
              }}
            />
          ) : (
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '100%',
                aspectRatio: '4.4 / 1',
                padding: 18,
                borderRadius: 12,
                background: 'linear-gradient(110deg, #E9F0DF 0%, #FAF6E9 100%)',
                color: '#31553E',
                fontSize: 22,
                fontWeight: 700,
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              {form.title || 'Text-only banner'}
            </div>
          )}

          <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
            <FormField label="Replace Image">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                style={inputStyle}
              />
            </FormField>
            {previewUrl && !form.image && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setPreviewUrl('');
                  setRemoveExistingImage(true);
                }}
              >
                Use Text Only
              </button>
            )}
            {removeExistingImage && (
              <span style={{ color: '#77746C', fontSize: 11 }}>
                The current image will be removed when you save.
              </span>
            )}
            {imageError && <Alert type="error" message={imageError} />}

            <FormField label="Banner Text / Title">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormField>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              <FormField label="Target Type">
                <input
                  name="target_type"
                  value={form.target_type}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Target ID">
                <input
                  name="target_id"
                  value={form.target_id}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormField label="Target URL">
              <input
                name="target_url"
                value={form.target_url}
                onChange={handleChange}
                placeholder="/products"
                style={inputStyle}
              />
            </FormField>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 14,
              }}
            >
              <FormField label="Display Order">
                <input
                  name="sort_order"
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Publish Status">
                <select
                  name="publish_status"
                  value={form.publish_status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {capitalize(status)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Visibility">
                <select
                  name="is_visible"
                  value={String(form.is_visible)}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="true">Visible</option>
                  <option value="false">Hidden</option>
                </select>
              </FormField>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              <FormField label="Start Date">
                <input
                  name="starts_at"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="End Date">
                <input
                  name="ends_at"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid #EDF0EB',
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={saving || Boolean(imageError)}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function WebMainPromoEditModal({
  banner,
  saving,
  onClose,
  onSave,
  bannerLabel = 'Main Promo Banner',
  validateRatio = true,
  previewAspectRatio = '7 / 3',
  contentOnly = false,
}) {
  const [form, setForm] = useState({
    title: banner.title || '',
    subtitle: banner.subtitle || '',
    eyebrow: banner.metadata?.eyebrow || '',
    heading_line2: banner.metadata?.heading_line2 || '',
    primary_cta_text: banner.metadata?.primary_cta_text || 'Shop Now',
    benefit_one: banner.metadata?.benefit_one || 'Natural Ingredients',
    benefit_two: banner.metadata?.benefit_two || 'Quality Assured',
    display_location:
      banner.metadata?.display_location || banner.title || '',
    sort_order: banner.sort_order ?? 1,
    publish_status: banner.publish_status || 'published',
    is_visible: banner.is_visible !== false,
    starts_at: banner.starts_at
      ? banner.starts_at.slice(0, 16)
      : '',
    ends_at: banner.ends_at
      ? banner.ends_at.slice(0, 16)
      : '',
    image: null,
  });
  const [previewUrl, setPreviewUrl] = useState(banner.image_url || '');
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setImageError('Only JPG, PNG, and WEBP images are allowed.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError('Banner image must be smaller than 10 MB.');
      event.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (
        validateRatio &&
        Math.abs(image.width / image.height - (7 / 3)) > 0.03
      ) {
        URL.revokeObjectURL(objectUrl);
        setImageError(
          `Please use a 7:3 image. Current image is ${image.width} × ${image.height}.`
        );
        event.target.value = '';
        return;
      }

      setPreviewUrl(objectUrl);
      setForm((current) => ({ ...current, image: file }));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setImageError('Unable to read the selected image.');
      event.target.value = '';
    };
    image.src = objectUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('title', form.title);
    if (contentOnly) {
      formData.append('subtitle', form.subtitle);
      formData.append('eyebrow', form.eyebrow);
      formData.append('heading_line2', form.heading_line2);
      formData.append('primary_cta_text', form.primary_cta_text);
      formData.append('benefit_one', form.benefit_one);
      formData.append('benefit_two', form.benefit_two);
    } else {
      formData.append('sort_order', String(form.sort_order));
      if (banner.platform === 'app') {
        formData.append('display_location', form.display_location);
      }
      formData.append('publish_status', form.publish_status);
      formData.append('is_visible', String(form.is_visible));
      formData.append('starts_at', form.starts_at);
      formData.append('ends_at', form.ends_at);
    }

    if (form.image) {
      formData.append('image', form.image);
    }

    await onSave(banner.id, formData);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]:
        name === 'sort_order'
          ? Math.max(1, Number(value))
          : name === 'is_visible'
            ? value === 'true'
            : value,
    }));
  };

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(15,35,25,0.48)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="main-promo-edit-title"
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 18,
          background: '#FFFFFF',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              id="main-promo-edit-title"
              style={{ margin: 0, color: '#123D2B', fontSize: 20 }}
            >
            Edit {bannerLabel}
            </h2>
            <p style={{ margin: '6px 0 0', color: '#77746C', fontSize: 13 }}>
              Update banner details or replace the image.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit dialog"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <img
            src={previewUrl}
            alt={form.title || bannerLabel}
            style={{
              display: 'block',
              width: '100%',
              aspectRatio: previewAspectRatio,
              objectFit: 'cover',
              borderRadius: 12,
              background: '#F3F4F0',
            }}
          />

          <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
            <FormField label="Replace Image">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                style={inputStyle}
              />
            </FormField>
            {imageError && <Alert type="error" message={imageError} />}

            <FormField label="Title">
              <input
                value={form.title}
                name="title"
                onChange={handleChange}
                placeholder="Main Promo Banner"
                style={inputStyle}
              />
            </FormField>
            {contentOnly && (
              <>
                <FormField label="Second Heading Line">
                  <input
                    name="heading_line2"
                    value={form.heading_line2}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Eyebrow">
                  <input
                    name="eyebrow"
                    value={form.eyebrow}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Subtitle">
                  <input
                    name="subtitle"
                    value={form.subtitle}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Button Text">
                  <input
                    name="primary_cta_text"
                    value={form.primary_cta_text}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="First Benefit">
                  <input
                    name="benefit_one"
                    value={form.benefit_one}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Second Benefit">
                  <input
                    name="benefit_two"
                    value={form.benefit_two}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </FormField>
              </>
            )}
            {banner.platform === 'app' && (
              <FormField label="Display Location">
                <select
                  value={form.display_location}
                  name="display_location"
                  onChange={handleChange}
                  style={inputStyle}
                >
                  {DISPLAY_LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 14,
              }}
            >
              <FormField label="Display Order">
                <input
                  type="number"
                  min="1"
                  name="sort_order"
                  value={form.sort_order}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Status">
                <select
                  name="publish_status"
                  value={form.publish_status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {capitalize(status)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Visibility">
                <select
                  name="is_visible"
                  value={String(form.is_visible)}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="true">Visible</option>
                  <option value="false">Hidden</option>
                </select>
              </FormField>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              <FormField label="Start Date">
                <input
                  type="datetime-local"
                  name="starts_at"
                  value={form.starts_at}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="End Date">
                <input
                  type="datetime-local"
                  name="ends_at"
                  value={form.ends_at}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid #EDF0EB',
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={saving || Boolean(imageError)}
            >
              {saving
                ? 'Saving...'
                : contentOnly
                  ? 'Save Banner and Text'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function WebMainPromoCreateModal({
  saving,
  error,
  onClose,
  onSave,
}) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [eyebrow, setEyebrow] = useState('');
  const [headingLine2, setHeadingLine2] = useState('');
  const [ctaText, setCtaText] = useState('Shop Now');
  const [benefitOne, setBenefitOne] = useState('Natural Ingredients');
  const [benefitTwo, setBenefitTwo] = useState('Quality Assured');
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState('');

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageError('');

    if (!file) {
      setImage(null);
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setImage(null);
      setImageError('Only JPG, PNG, and WEBP images are allowed.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImage(null);
      setImageError('Image must be smaller than 10 MB.');
      event.target.value = '';
      return;
    }

    setImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setImageError('Please enter a banner heading.');
      return;
    }

    if (!image) {
      setImageError('Please select a promo banner image.');
      return;
    }

    const formData = new FormData();
    formData.append('platform', 'web');
    formData.append('placement', 'main-promo-banner');
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('eyebrow', eyebrow);
    formData.append('heading_line2', headingLine2);
    formData.append('primary_cta_text', ctaText);
    formData.append('benefit_one', benefitOne);
    formData.append('benefit_two', benefitTwo);
    formData.append('sort_order', '1');
    formData.append('publish_status', 'published');
    formData.append('image', image);

    await onSave(formData);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const setters = {
      title: setTitle,
      subtitle: setSubtitle,
      eyebrow: setEyebrow,
      heading_line2: setHeadingLine2,
      primary_cta_text: setCtaText,
      benefit_one: setBenefitOne,
      benefit_two: setBenefitTwo,
    };
    if (setters[name]) {
      setters[name](value);
    }
  };

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(15,35,25,0.48)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="main-promo-create-title"
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 18,
          background: '#FFFFFF',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              id="main-promo-create-title"
              style={{ margin: 0, color: '#123D2B', fontSize: 20 }}
            >
              Add Promo Banner
            </h2>
            <p style={{ margin: '6px 0 0', color: '#77746C', fontSize: 13 }}>
              Upload a new promotional banner for the website.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close create dialog"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <Alert type="error" message={error} />}

          <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
            <FormField label="Banner Image" required>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                required
                onChange={handleImageChange}
                style={inputStyle}
              />
            </FormField>
            {image && (
              <span style={{ color: '#77746C', fontSize: 12 }}>
                Selected: {image.name}
              </span>
            )}
            {imageError && <Alert type="error" message={imageError} />}

            <FormField label="Heading">
              <input
                type="text"
                name="title"
                value={title}
                onChange={handleChange}
                placeholder="Daily Wellness"
                required
                style={inputStyle}
              />
            </FormField>
            <FormField label="Second Heading Line">
              <input
                name="heading_line2"
                value={headingLine2}
                onChange={handleChange}
                placeholder="Essentials"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Eyebrow">
              <input
                name="eyebrow"
                value={eyebrow}
                onChange={handleChange}
                placeholder="THE AUMVEDA COLLECTION"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Subtitle">
              <input
                name="subtitle"
                value={subtitle}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormField>
            <FormField label="Button Text">
              <input
                name="primary_cta_text"
                value={ctaText}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormField>
            <FormField label="First Benefit">
              <input
                name="benefit_one"
                value={benefitOne}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormField>
            <FormField label="Second Benefit">
              <input
                name="benefit_two"
                value={benefitTwo}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormField>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid #EDF0EB',
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={saving || !image || Boolean(imageError)}
            >
              {saving ? 'Uploading...' : 'Upload Banner'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function WebShopByNeedCreateModal({
  saving,
  error,
  onClose,
  onSave,
}) {
  const [title, setTitle] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [publishStatus, setPublishStatus] = useState('published');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState('');

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageError('');

    if (!file) {
      setImage(null);
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setImage(null);
      setImageError('Only JPG, PNG, and WEBP images are allowed.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImage(null);
      setImageError('Image must be smaller than 10 MB.');
      event.target.value = '';
      return;
    }

    setImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!image) {
      setImageError('Please select an image.');
      return;
    }

    const formData = new FormData();
    formData.append('platform', 'web');
    formData.append('placement', 'shop-by-need');
    formData.append('title', title);
    formData.append('sort_order', String(sortOrder));
    formData.append('publish_status', publishStatus);
    formData.append('image', image);

    if (startsAt) {
      formData.append('starts_at', startsAt);
    }

    if (endsAt) {
      formData.append('ends_at', endsAt);
    }

    await onSave(formData);
  };

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(15,35,25,0.48)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-by-need-create-title"
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 18,
          background: '#FFFFFF',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              id="shop-by-need-create-title"
              style={{ margin: 0, color: '#123D2B', fontSize: 20 }}
            >
              Add Shop by Need
            </h2>
            <p style={{ margin: '6px 0 0', color: '#77746C', fontSize: 13 }}>
              Upload a new Shop by Need image for the website.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close create dialog"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <Alert type="error" message={error} />}

          <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
            <FormField label="Image" required>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                required
                onChange={handleImageChange}
                style={inputStyle}
              />
            </FormField>
            {image && (
              <span style={{ color: '#77746C', fontSize: 12 }}>
                Selected: {image.name}
              </span>
            )}
            {imageError && <Alert type="error" message={imageError} />}

            <FormField label="Title">
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Hair Care"
                style={inputStyle}
              />
            </FormField>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 14,
              }}
            >
              <FormField label="Display Order" required>
                <input
                  type="number"
                  min="1"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Status" required>
                <select
                  value={publishStatus}
                  onChange={(event) => setPublishStatus(event.target.value)}
                  style={inputStyle}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {capitalize(status)}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              <FormField label="Start Date">
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="End Date">
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid #EDF0EB',
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={saving || !image || Boolean(imageError)}
            >
              {saving ? 'Uploading...' : 'Upload Banner'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* ============================================================
   PLATFORM SELECTION
============================================================ */

function PlatformSelection({
  onSelect,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 24,
        width: '100%',
      }}
    >
      {/* =====================================================
          MOBILE APP
      ===================================================== */}
      <div
        onClick={() => onSelect('app')}
        style={{
          position: 'relative',
          minHeight: 210,
          padding: '28px 30px',
          borderRadius: 18,
          background: 'linear-gradient(135deg, #FFF8F9 0%, #FBE9EE 100%)',
          border: '1px solid #F0E2E5',
          boxShadow: '0 8px 24px rgba(18, 61, 43, 0.06)',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = 'translateY(-2px)';
          event.currentTarget.style.boxShadow = '0 14px 32px rgba(18, 61, 43, 0.10)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = 'translateY(0)';
          event.currentTarget.style.boxShadow = '0 8px 24px rgba(18, 61, 43, 0.06)';
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 170,
            height: 170,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.42)',
            top: -65,
            left: -55,
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: 130,
            height: 130,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.30)',
            bottom: -65,
            left: 100,
          }}
        />

        <div
          style={{
            width: 190,
            minWidth: 190,
            height: 155,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 82,
              height: 145,
              borderRadius: 18,
              background: '#FFFFFF',
              border: '4px solid #123D2B',
              boxShadow: '0 8px 18px rgba(18, 61, 43, 0.14)',
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
            }}
          >
            <div
              style={{
                width: 28,
                height: 5,
                borderRadius: 10,
                background: '#123D2B',
                margin: '0 auto 3px',
              }}
            />

            <div
              style={{
                height: 34,
                borderRadius: 7,
                background: '#F8DDE3',
              }}
            />

            <div
              style={{
                height: 23,
                borderRadius: 6,
                background: '#FBECEF',
              }}
            />

            <div
              style={{
                height: 23,
                borderRadius: 6,
                background: '#FBECEF',
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 5,
              }}
            >
              <div
                style={{
                  height: 20,
                  borderRadius: 5,
                  background: '#F7E6EA',
                }}
              />

              <div
                style={{
                  height: 20,
                  borderRadius: 5,
                  background: '#F7E6EA',
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 22,
              lineHeight: 1.25,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Mobile App
          </h3>

          <p
            style={{
              margin: '8px 0 20px',
              maxWidth: 300,
              color: '#4B4B4B',
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            Manage home sections, banners, categories and app content.
          </p>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect('app');
            }}
            style={{
              border: 'none',
              borderRadius: 9,
              padding: '11px 22px',
              background: '#075B3B',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 5px 12px rgba(7, 91, 59, 0.18)',
            }}
          >
            Manage App
            <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
          </button>
        </div>
      </div>

      {/* =====================================================
          CUSTOMER WEB
      ===================================================== */}
      <div
        onClick={() => onSelect('web')}
        style={{
          position: 'relative',
          minHeight: 210,
          padding: '28px 30px',
          borderRadius: 18,
          background: 'linear-gradient(135deg, #F8F7FF 0%, #EEECFF 100%)',
          border: '1px solid #E5E1F3',
          boxShadow: '0 8px 24px rgba(18, 61, 43, 0.06)',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = 'translateY(-2px)';
          event.currentTarget.style.boxShadow = '0 14px 32px rgba(18, 61, 43, 0.10)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = 'translateY(0)';
          event.currentTarget.style.boxShadow = '0 8px 24px rgba(18, 61, 43, 0.06)';
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 170,
            height: 170,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.45)',
            top: -65,
            left: -55,
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: 130,
            height: 130,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.32)',
            bottom: -65,
            left: 100,
          }}
        />

        <div
          style={{
            width: 190,
            minWidth: 190,
            height: 155,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 145,
              height: 105,
              borderRadius: 12,
              background: '#FFFFFF',
              border: '4px solid #123D2B',
              boxShadow: '0 8px 18px rgba(18, 61, 43, 0.14)',
              padding: 9,
            }}
          >
            <div
              style={{
                height: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 7,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D7D7D7' }} />
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D7D7D7' }} />
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D7D7D7' }} />
            </div>

            <div
              style={{
                height: 28,
                borderRadius: 6,
                background: '#E8E4FA',
                marginBottom: 7,
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 5,
              }}
            >
              <div style={{ height: 38, borderRadius: 5, background: '#F0EEFC' }} />
              <div style={{ height: 38, borderRadius: 5, background: '#F0EEFC' }} />
              <div style={{ height: 38, borderRadius: 5, background: '#F0EEFC' }} />
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 22,
              lineHeight: 1.25,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Customer Web
          </h3>

          <p
            style={{
              margin: '8px 0 20px',
              maxWidth: 300,
              color: '#4B4B4B',
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            Manage web homepage, banners, sections and storefront content.
          </p>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect('web');
            }}
            style={{
              border: 'none',
              borderRadius: 9,
              padding: '11px 22px',
              background: '#075B3B',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 5px 12px rgba(7, 91, 59, 0.18)',
            }}
          >
            Manage Web
            <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   APP HOME SECTIONS
============================================================ */

function AppHomeSections({
  sections,
  categories,
  categoryBanners,
  loading,
  saving,
  error,
  headerCategorySavingId,
  headerCategoryError,
  onBack,
  onToggleHeaderCategory,
  onEditHeaderCategoryBanner,
  onManageDeals,
  onManageCampaigns,
  onDragStart,
  onDrop,
}) {
  const [headerCategoriesOpen, setHeaderCategoriesOpen] = useState(false);

  return (
    <>
      <div className="app-home-sections">
      <BackButton label="Back to Platforms" onClick={onBack} />

      <section
        className="app-home-header-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          marginBottom: 16,
          padding: '18px 22px',
          background: '#FFFFFF',
          border: '1px solid #E2E7DF',
          borderRadius: 16,
          boxShadow: '0 8px 28px rgba(18,61,43,0.05)',
        }}
      >
        <div>
          <h2 className="app-home-card-title" style={{ margin: 0, fontSize: 17, color: '#123D2B' }}>
            Header
          </h2>
          <p className="app-home-card-copy" style={{ margin: '5px 0 0', color: '#77746C', fontSize: 12 }}>
            Fixed at the top of the app home. Manage its categories and each
            category&apos;s banner here.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setHeaderCategoriesOpen(true)}
          disabled={saving}
        >
          Manage Header
        </button>
      </section>

      <section
        className="app-home-sections-card"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E7DF',
          borderRadius: 18,
          padding: 24,
          boxShadow: '0 8px 28px rgba(18,61,43,0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 20,
            marginBottom: 22,
          }}
        >
          <div>
            <h2 className="app-home-card-title" style={{ margin: 0, fontSize: 20, color: '#123D2B' }}>
              Home Sections
            </h2>
            <p className="app-home-card-copy" style={{ margin: '6px 0 0', color: '#77746C', fontSize: 13 }}>
              Reorder the sections configured for the customer mobile app.
            </p>
          </div>
        </div>

        {saving && (
          <div style={{ color: '#77746C', fontSize: 12, marginBottom: 12 }}>
            Saving section order...
          </div>
        )}
        {error && <Alert type="error" message={error} />}

        {loading ? (
          <div style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: '#77746C', fontSize: 13 }}>
            Loading app sections...
          </div>
        ) : sections.length === 0 ? (
          <EmptyState
            title="No app homepage sections configured"
            description="Sections are loaded from the app homepage CMS configuration."
          />
        ) : (
          <div className="app-home-section-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="app-home-section-row"
                draggable
                onDragStart={() => onDragStart(section.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onDrop(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  minHeight: 76,
                  padding: '13px 15px',
                  border: '1px solid #E2E7DF',
                  borderRadius: 14,
                  background: '#FFFFFF',
                  cursor: 'grab',
                }}
              >
                <GripVertical className="app-home-section-grip" size={18} color="#A1A8A0" />
                <div
                  className="app-home-section-order"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: '#F2F6F1',
                    color: '#276345',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="app-home-section-title" style={{ color: '#123D2B', fontSize: 14, fontWeight: 700 }}>
                    {section.title || section.section_key || 'Untitled Section'}
                  </div>
                  <div
                    className="app-home-section-meta"
                    style={{
                      display: 'flex',
                      gap: 12,
                      marginTop: 6,
                      color: '#858A84',
                      fontSize: 11,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{section.section_key || '—'}</span>
                    <span>{section.section_type || 'section'}</span>
                    <span>
                      Items: {Array.isArray(section.items) ? section.items.length : 0}
                    </span>
                    <span>Order: {section.sort_order ?? index + 1}</span>
                  </div>
                </div>
                {[
                  'app_category_campaigns',
                  'category_campaigns',
                  'campaigns',
                ].includes(getWebSectionKey(section)) ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={onManageCampaigns}
                    disabled={saving}
                  >
                    Manage campaigns
                  </button>
                ) : [
                  'app_deals_of_week',
                  'deals_of_week',
                  'deals',
                  'hero_banner',
                ].includes(getWebSectionKey(section)) ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={onManageDeals}
                    disabled={saving}
                  >
                    Manage banners
                  </button>
                ) : (
                  <span style={{ color: '#858A84', fontSize: 11, flexShrink: 0 }}>
                    Reorder only
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      </div>

      {headerCategoriesOpen && (
        <AppHeaderCategoriesModal
          categories={categories}
          categoryBanners={categoryBanners}
          savingId={headerCategorySavingId}
          error={headerCategoryError}
          onClose={() => setHeaderCategoriesOpen(false)}
          onToggleCategory={onToggleHeaderCategory}
          onEditBanner={(category) => {
            setHeaderCategoriesOpen(false);
            onEditHeaderCategoryBanner(category);
          }}
        />
      )}
    </>
  );
}

function AppHeaderCategoriesModal({
  categories,
  categoryBanners,
  savingId,
  error,
  onClose,
  onToggleCategory,
  onEditBanner,
}) {
  const visibleCategories = [...categories]
    .filter((category) => category && category.is_active !== false)
    .sort((first, second) =>
      String(first.name || '').localeCompare(String(second.name || ''))
    );

  return (
    <div
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: 'rgba(20, 32, 25, 0.48)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-header-categories-title"
        style={{
          width: 'min(680px, 100%)',
          maxHeight: 'min(760px, 90vh)',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 18,
          background: '#FFFFFF',
          boxShadow: '0 18px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              id="app-header-categories-title"
              style={{ margin: 0, fontSize: 20, color: '#123D2B' }}
            >
              App Header Categories
            </h2>
            <p style={{ margin: '6px 0 0', color: '#77746C', fontSize: 13 }}>
              Add or remove existing categories from the fixed app header.
              Each included category can have its own banner.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            aria-label="Close header category manager"
          >
            <X size={16} />
          </button>
        </div>

        {error && <Alert type="error" message={error} />}

        {visibleCategories.length === 0 ? (
          <EmptyState
            title="No categories available"
            description="Create a category before adding it to the app header."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {visibleCategories.map((category) => {
              const isVisible = Boolean(category.show_on_home);
              const isSaving = String(savingId) === String(category.id);
              const hasBanner = categoryBanners.some(
                (banner) =>
                  String(banner.category_id) === String(category.id)
              );

              return (
                <div
                  key={category.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    border: '1px solid #E2E7DF',
                    borderRadius: 12,
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flex: 1,
                      minWidth: 0,
                      color: '#123D2B',
                      fontSize: 14,
                      fontWeight: 650,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      disabled={Boolean(savingId)}
                      onChange={() => onToggleCategory(category)}
                      aria-label={`${isVisible ? 'Remove' : 'Add'} ${category.name} ${
                        isVisible ? 'from' : 'to'
                      } the app header`}
                    />
                    <span>{category.name}</span>
                  </label>
                  {isVisible && (
                    <>
                      <span
                        style={{
                          color: hasBanner ? '#276345' : '#858A84',
                          fontSize: 11,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {hasBanner ? 'Banner configured' : 'No banner'}
                      </span>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => onEditBanner(category)}
                        disabled={Boolean(savingId)}
                      >
                        {hasBanner ? 'Edit banner' : 'Add banner'}
                      </button>
                    </>
                  )}
                  {isSaving && (
                    <Loader2
                      size={16}
                      color="#276345"
                      aria-label="Saving category"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   WEB HOME SECTIONS
============================================================ */

function SectionEditorWorkspace({ children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        overflowY: 'auto',
        background: '#F6F8F5',
      }}
    >
      <div
        style={{
          width: 'min(1440px, 100%)',
          minHeight: '100%',
          margin: '0 auto',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function WebHomeSections({
  sections,
  loading,
  saving,
  error,
  onBack,
  onEdit,
  onDragStart,
  onDrop,
}) {
  const reorderableSections = sections.filter(
    (section) => !isFixedNavbarSection(section)
  );

  return (
    <div className="web-home-sections">
      <BackButton
        label="Back to Platforms"
        onClick={onBack}
      />

      <section
        className="web-home-sections-card"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E7DF',
          borderRadius: 18,
          padding: 24,
          boxShadow: '0 8px 28px rgba(18,61,43,0.05)',
        }}
      >
        <div
          className="web-home-sections-heading"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 20,
            marginBottom: 22,
          }}
        >
          <div>
            <h2 className="app-home-card-title" style={{ margin: 0, fontSize: 20, color: '#123D2B' }}>
              Home Sections
            </h2>
            <p className="app-home-card-copy" style={{ margin: '6px 0 0', color: '#77746C', fontSize: 13, lineHeight: 1.6 }}>
              Manage the sections displayed on the customer website home page.
            </p>
          </div>

        </div>

        {saving && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#77746C', fontSize: 12, marginBottom: 12 }}>
            <Loader2 size={14} style={{ animation: 'banner-spin 1s linear infinite' }} />
            Saving...
          </div>
        )}

        {error && <Alert type="error" message={error} />}

        {loading ? (
          <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#77746C', fontSize: 13, border: '1px dashed #D9E0D6', borderRadius: 14, background: '#FAFCF9' }}>
            Loading website sections...
          </div>
        ) : reorderableSections.length === 0 ? (
          <div style={{ minHeight: 220, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', color: '#77746C', fontSize: 13, border: '1px dashed #D9E0D6', borderRadius: 14, background: '#FAFCF9' }}>
            <span>No website home sections found.</span>
          </div>
        ) : (
          <div className="web-home-section-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reorderableSections.map((section, index) => {
              const action = getWebSectionAction(section);
              const actionLabel = {
                hero: 'Manage banners',
                categories: 'Manage categories',
                'shop-by-need': 'Edit cards',
                'main-promo': 'Edit banner and text',
                'category-campaigns': 'Edit cards',
                'more-discovery': 'Edit cards',
              }[action];

              return (
                <div
                  key={section.id}
                  className="web-home-section-row"
                  draggable
                  onDragStart={() => onDragStart(section.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => onDrop(section.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    minHeight: 82,
                    padding: '13px 15px',
                    border: '1px solid #E2E7DF',
                    borderRadius: 14,
                    background: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(18,61,43,0.035)',
                    cursor: 'grab',
                  }}
                >
                  <GripVertical
                    className="web-home-section-grip"
                    size={18}
                    color="#A1A8A0"
                    style={{ flexShrink: 0 }}
                  />
                  <div
                    className="web-home-section-order"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: '#F2F6F1',
                      color: '#276345',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div className="web-home-section-main" style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="web-home-section-heading"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        className="web-home-section-title"
                        style={{
                          color: '#123D2B',
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {section.title ||
                          section.section_key ||
                          'Untitled Section'}
                      </span>
                      <span
                        className="web-home-section-type"
                        style={{
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: '#F3F4F2',
                          color: '#6D746D',
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {section.section_type || 'section'}
                      </span>
                    </div>

                    <div
                      className="web-home-section-meta"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 6,
                        color: '#858A84',
                        fontSize: 11,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>{section.section_key || '—'}</span>
                      <span>
                        Items:{' '}
                        {Array.isArray(section.items)
                          ? section.items.length
                          : 0}
                      </span>
                      <span>
                        Order: {section.sort_order ?? index + 1}
                      </span>
                    </div>
                  </div>

                  {actionLabel ? (
                    <button
                      type="button"
                      className="web-home-section-action"
                      title={actionLabel}
                      onClick={() => onEdit(section)}
                      disabled={saving}
                      style={{
                        border: '1px solid #DCE8D9',
                        borderRadius: 9,
                        padding: '9px 12px',
                        background: '#F7FAF6',
                        color: '#276345',
                        fontSize: 11,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.65 : 1,
                        flexShrink: 0,
                      }}
                    >
                      {actionLabel}
                    </button>
                  ) : (
                    <span
                      className="web-home-section-reorder"
                      style={{
                        color: '#858A84',
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      Reorder only
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ExploreCategoriesEditor({
  open,
  section,
  categories,
  saving,
  error,
  onClose,
  onSave,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryToAdd, setCategoryToAdd] = useState('');
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState('');

  const categoryOptions = flattenWebCategories(categories);

  useEffect(() => {
    if (!open) return;

    const categoryItems = (section?.items || [])
      .filter(
        (item) =>
          item?.target_type === 'category' &&
          item?.target_id
      )
      .sort(
        (left, right) =>
          Number(left.sort_order || 0) -
          Number(right.sort_order || 0)
      );
    const managed =
      section?.content_config?.categories_managed === true ||
      categoryItems.length > 0;
    const configured = managed
      ? categoryItems.map((item) => ({
          id: item.id,
          categoryId: String(item.target_id),
        }))
      : categoryOptions.map((category) => ({
          id: null,
          categoryId: String(category.id),
        }));

    setSelectedCategories(configured);
    setCategoryToAdd('');
    setItemError('');
  }, [open, section, categories]);

  if (!open) return null;

  const selectedIds = new Set(
    selectedCategories.map((item) => item.categoryId)
  );
  const availableCategories = categoryOptions.filter(
    (category) => !selectedIds.has(String(category.id))
  );

  const addCategory = () => {
    const category = availableCategories.find(
      (item) => String(item.id) === categoryToAdd
    );
    if (!category) return;

    setSelectedCategories((current) => [
      ...current,
      {
        id: null,
        categoryId: String(category.id),
      },
    ]);
    setCategoryToAdd('');
  };

  const save = async (event) => {
    event.preventDefault();
    setItemError('');

    const configuredItems = (section?.items || []).filter(
      (item) => item?.target_type === 'category'
    );
    const selectedIdsToSave = new Set(
      selectedCategories.map((item) => item.categoryId)
    );
    const removedItems = configuredItems.filter(
      (item) => !selectedIdsToSave.has(String(item.target_id))
    );

    if (
      removedItems.length > 0 &&
      !window.confirm(
        `Remove ${removedItems.length} category from Explore Wellness?`
      )
    ) {
      return;
    }

    try {
      setItemSaving(true);
      for (const [index, selected] of selectedCategories.entries()) {
        const category = categoryOptions.find(
          (item) => String(item.id) === selected.categoryId
        );
        if (!category) continue;

        const payload = {
          item_type: 'category_tile',
          title: category.name,
          target_type: 'category',
          target_id: category.id,
          sort_order: index + 1,
          is_visible: true,
          publish_status: 'published',
        };
        if (selected.id) {
          await onUpdateItem(selected.id, payload, false);
        } else {
          await onCreateItem(section.id, payload, false);
        }
      }

      for (const item of removedItems) {
        await onDeleteItem(item.id, false, false);
      }

      await onSave({
        content_config: {
          ...(section?.content_config || {}),
          categories_managed: true,
        },
      });
    } catch (saveError) {
      setItemError(
        saveError?.message ||
          'Unable to save Explore Wellness categories.'
      );
    } finally {
      setItemSaving(false);
    }
  };

  const fieldStyle = {
    width: '100%',
    padding: '9px 10px',
    border: '1px solid #D9E0D6',
    borderRadius: 9,
    fontSize: 12,
    color: '#26352C',
    background: '#FFFFFF',
    boxSizing: 'border-box',
  };

  return (
    <SectionEditorWorkspace>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#123D2B', fontSize: 20 }}>
              Manage Explore Wellness Categories
            </h2>
            <p style={{ margin: '6px 0 0', color: '#77746C', fontSize: 12 }}>
              Add or remove categories only. Category names and images come from the category catalog.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={saving || itemSaving}
            aria-label="Close category editor"
          >
            <X size={17} />
          </button>
        </div>

        {(error || itemError) && (
          <Alert type="error" message={itemError || error} />
        )}

        <form onSubmit={save}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              alignItems: 'start',
            }}
          >
            <section
              style={{
                padding: 20,
                border: '1px solid #E2E7DF',
                borderRadius: 14,
                background: '#FFFFFF',
              }}
            >
              <h3 style={{ margin: '0 0 14px', color: '#123D2B', fontSize: 16 }}>
                Add Category
              </h3>
              <div style={{ display: 'grid', gap: 10 }}>
                <select
                  value={categoryToAdd}
                  onChange={(event) => setCategoryToAdd(event.target.value)}
                  style={fieldStyle}
                >
                  <option value="">Select a category to add</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={addCategory}
                  disabled={!categoryToAdd || itemSaving}
                >
                  Add Category
                </button>
              </div>
            </section>

            <section
              style={{
                padding: 20,
                border: '1px solid #E2E7DF',
                borderRadius: 14,
                background: '#FFFFFF',
              }}
            >
              <h3 style={{ margin: '0 0 14px', color: '#123D2B', fontSize: 16 }}>
                Existing Categories
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
            {selectedCategories.map((selected, index) => {
              const category = categoryOptions.find(
                (item) => String(item.id) === selected.categoryId
              );
              return (
                <div
                  key={selected.categoryId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    border: '1px solid #E2E7DF',
                    borderRadius: 10,
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 8,
                      background: '#F1F7F0',
                      color: '#276345',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span style={{ flex: 1, color: '#123D2B', fontSize: 13 }}>
                    {category?.name || 'Unavailable category'}
                  </span>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setSelectedCategories((current) =>
                        current.filter(
                          (item) => item.categoryId !== selected.categoryId
                        )
                      )
                    }
                    disabled={itemSaving}
                    aria-label={`Remove ${category?.name || 'category'}`}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
            </section>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #EDF0EB',
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={itemSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={saving || itemSaving}
            >
              {saving || itemSaving ? 'Saving...' : 'Save Categories'}
            </button>
          </div>
        </form>
    </SectionEditorWorkspace>
  );
}

const DISCOVERY_CARD_DEFAULTS = [
  {
    itemKey: 'new-arrivals',
    title: 'New Arrivals',
    subtitle: 'Fresh wellness essentials',
  },
  {
    itemKey: 'travel-essentials',
    title: 'Travel Essentials',
    subtitle: 'Wellness on the go',
  },
  {
    itemKey: 'gift-sets',
    title: 'Gift Sets',
    subtitle: 'Perfect for loved ones',
  },
  {
    itemKey: 'seasonal-picks',
    title: 'Seasonal Picks',
    subtitle: 'Curated for every season',
  },
];

const CATEGORY_CAMPAIGN_DEFAULTS = [
  { itemKey: 'category-campaign-1', keywords: ['hair', 'scalp'] },
  { itemKey: 'category-campaign-2', keywords: ['skin', 'face'] },
  { itemKey: 'category-campaign-3', keywords: ['nutrition', 'immunity'] },
];

function HomepageCardsEditor({
  open,
  section,
  type,
  categories,
  saving,
  error,
  onClose,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onItemsSaved,
}) {
  const [cards, setCards] = useState([]);
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState('');
  const [imageError, setImageError] = useState('');

  const categoryOptions = flattenWebCategories(categories);
  const isCampaignSection = type === 'category-campaigns';
  const cardLimit = isCampaignSection ? 3 : 4;

  useEffect(() => {
    if (!open) return;

    const sourceItems = Array.isArray(section?.items)
      ? [...section.items].sort(
          (left, right) =>
            Number(left.sort_order || 0) -
            Number(right.sort_order || 0)
        )
      : [];

    if (isCampaignSection) {
      setCards(
        CATEGORY_CAMPAIGN_DEFAULTS.map((fallback, index) => {
          const item = sourceItems[index];
          const category = categoryOptions.find(
            (entry) =>
              String(entry.id) === String(item?.target_id)
          );
          const fallbackCategory = categoryOptions.find((entry) => {
            const name = `${entry.name || ''} ${entry.slug || ''}`
              .toLowerCase();
            return fallback.keywords.some((keyword) =>
              name.includes(keyword)
            );
          });
          const selectedCategory = category || fallbackCategory;

          return {
            id: item?.id || null,
            item_key: item?.item_key || fallback.itemKey,
            category_id: selectedCategory
              ? String(selectedCategory.id)
              : '',
            title: selectedCategory?.name || item?.title || '',
            subtitle: item?.subtitle || item?.description || '',
            image_url: item?.image_url || '',
            image_file: null,
            sort_order: item?.sort_order ?? index + 1,
          };
        })
      );
    } else {
      const keyedItems = new Map();
      const unkeyedItems = [];
      sourceItems.forEach((item) => {
        const key = item.item_key || item.metadata?.card_key;
        if (key) {
          keyedItems.set(key, item);
        } else {
          unkeyedItems.push(item);
        }
      });

      setCards(
        DISCOVERY_CARD_DEFAULTS.map((fallback, index) => {
          const item =
            keyedItems.get(fallback.itemKey) ||
            unkeyedItems[index] ||
            null;
          return {
            id: item?.id || null,
            item_key: fallback.itemKey,
            title: item?.title || fallback.title,
            subtitle: item?.subtitle || fallback.subtitle,
            image_url: item?.image_url || '',
            image_file: null,
            sort_order: item?.sort_order ?? index + 1,
          };
        })
      );
    }

    setItemError('');
    setImageError('');
  }, [open, section, categories, isCampaignSection]);

  if (!open) return null;

  const updateCard = (index, key, value) => {
    setCards((current) =>
      current.map((card, cardIndex) =>
        cardIndex === index
          ? { ...card, [key]: value }
          : card
      )
    );
  };

  const handleCategoryChange = (index, categoryId) => {
    const category = categoryOptions.find(
      (item) => String(item.id) === String(categoryId)
    );
    setCards((current) =>
      current.map((card, cardIndex) =>
        cardIndex === index
          ? {
              ...card,
              category_id: categoryId,
              title: category?.name || '',
            }
          : card
      )
    );
  };

  const handleImageChange = (index, file) => {
    const validationMessage = validateHomepageImage(file);
    setImageError(validationMessage);
    if (validationMessage) return;
    updateCard(index, 'image_file', file || null);
  };

  const save = async (event) => {
    event.preventDefault();
    setItemError('');

    if (cards.length !== cardLimit) {
      setItemError(
        `This section must contain exactly ${cardLimit} cards.`
      );
      return;
    }

    if (isCampaignSection) {
      const selectedCategoryIds = cards.map(
        (card) => card.category_id
      );
      if (
        selectedCategoryIds.some((id) => !id) ||
        new Set(selectedCategoryIds).size !== cardLimit
      ) {
        setItemError(
          'Select a different category for each card.'
        );
        return;
      }
    } else if (cards.some((card) => !card.title.trim())) {
      setItemError('Each card must have a title.');
      return;
    }

    if (imageError) {
      setItemError(imageError);
      return;
    }

    const retainedItemIds = new Set(
      cards.map((card) => card.id).filter(Boolean)
    );
    const extraItems = (section?.items || []).filter(
      (item) => item?.id && !retainedItemIds.has(item.id)
    );
    if (
      extraItems.length > 0 &&
      !window.confirm(
        `This section allows ${cardLimit} cards. Remove ${extraItems.length} extra card(s)?`
      )
    ) {
      return;
    }

    try {
      setItemSaving(true);

      for (const [index, card] of cards.entries()) {
        let imageUrl = card.image_url;
        if (card.image_file) {
          const uploadResponse =
            await uploadContentManagementImage(
              section.id,
              card.image_file
            );
          imageUrl = getUploadedImageUrl(uploadResponse);
          if (!imageUrl) {
            throw new Error('Image upload did not return an image URL.');
          }
        }

        const category = isCampaignSection
          ? categoryOptions.find(
              (item) => String(item.id) === card.category_id
            )
          : null;
        const payload = {
          item_key: card.item_key,
          item_type: isCampaignSection
            ? 'category_campaign'
            : 'discovery_card',
          title: category?.name || card.title.trim(),
          subtitle: card.subtitle.trim() || null,
          image_url: imageUrl || null,
          sort_order: Number(card.sort_order) || index + 1,
          is_visible: true,
          publish_status: 'published',
        };

        if (isCampaignSection) {
          payload.target_type = 'category';
          payload.target_id = category.id;
          payload.target_url = null;
          payload.primary_cta_url = null;
        }

        if (card.id) {
          await onUpdateItem(card.id, payload, false);
        } else {
          await onCreateItem(section.id, payload, false);
        }
      }

      for (const item of extraItems) {
        await onDeleteItem(item.id, false, false);
      }

      await onItemsSaved();
    } catch (saveError) {
      setItemError(
        saveError?.message ||
          `Unable to save ${isCampaignSection ? 'category campaigns' : 'More Discovery cards'}.`
      );
    } finally {
      setItemSaving(false);
    }
  };

  const fieldStyle = {
    width: '100%',
    padding: '9px 10px',
    border: '1px solid #D9E0D6',
    borderRadius: 9,
    fontSize: 12,
    color: '#26352C',
    background: '#FFFFFF',
    boxSizing: 'border-box',
  };
  const heading = isCampaignSection
    ? 'Edit Category Campaigns'
    : 'Edit More Discovery Cards';

  return (
    <SectionEditorWorkspace>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#123D2B', fontSize: 20 }}>
              {heading}
            </h2>
            <p style={{ margin: '6px 0 0', color: '#77746C', fontSize: 12 }}>
              {isCampaignSection
                ? 'Exactly 3 cards. Choose a category, image, subtitle, and display order.'
                : 'Exactly 4 cards. Edit only the text, image, and display order.'}
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={saving || itemSaving}
            aria-label="Close card editor"
          >
            <X size={17} />
          </button>
        </div>

        {(error || itemError || imageError) && (
          <Alert
            type="error"
            message={itemError || imageError || error}
          />
        )}

        <form onSubmit={save}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 14,
              alignItems: 'start',
            }}
          >
          {cards.map((card, index) => (
            <article
              key={card.item_key}
              style={{
                marginBottom: 12,
                padding: 14,
                border: '1px solid #E2E7DF',
                borderRadius: 12,
                background: '#FFFFFF',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <strong style={{ color: '#123D2B', fontSize: 13 }}>
                  Card {index + 1}
                </strong>
                <label style={{ color: '#59645C', fontSize: 11 }}>
                  Order{' '}
                  <input
                    type="number"
                    min="1"
                    value={card.sort_order}
                    onChange={(event) =>
                      updateCard(index, 'sort_order', event.target.value)
                    }
                    style={{ ...fieldStyle, width: 70, marginLeft: 6 }}
                  />
                </label>
              </div>

              {isCampaignSection ? (
                <>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      color: '#59645C',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    Category
                  </label>
                  <select
                    value={card.category_id}
                    onChange={(event) =>
                      handleCategoryChange(index, event.target.value)
                    }
                    style={fieldStyle}
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <label
                    style={{
                      display: 'block',
                      margin: '12px 0 6px',
                      color: '#59645C',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    Category Title
                  </label>
                  <input
                    value={card.title}
                    readOnly
                    style={{ ...fieldStyle, background: '#F5F7F4' }}
                  />
                </>
              ) : (
                <>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      color: '#59645C',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    Title
                  </label>
                  <input
                    value={card.title}
                    onChange={(event) =>
                      updateCard(index, 'title', event.target.value)
                    }
                    style={fieldStyle}
                  />
                </>
              )}

              <label
                style={{
                  display: 'block',
                  margin: '12px 0 6px',
                  color: '#59645C',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Subtitle
              </label>
              <input
                value={card.subtitle}
                onChange={(event) =>
                  updateCard(index, 'subtitle', event.target.value)
                }
                style={fieldStyle}
              />

              <label
                style={{
                  display: 'block',
                  margin: '12px 0 6px',
                  color: '#59645C',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Image
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  handleImageChange(index, event.target.files?.[0])
                }
                style={fieldStyle}
              />
              {card.image_file && (
                <span
                  style={{
                    display: 'block',
                    marginTop: 6,
                    color: '#77746C',
                    fontSize: 11,
                  }}
                >
                  Selected: {card.image_file.name}
                </span>
              )}
              {card.image_url && (
                <img
                  src={card.image_url}
                  alt=""
                  style={{
                    display: 'block',
                    width: '100%',
                    maxHeight: 150,
                    marginTop: 10,
                    objectFit: 'cover',
                    borderRadius: 9,
                  }}
                />
              )}
            </article>
          ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #EDF0EB',
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={itemSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={saving || itemSaving || Boolean(imageError)}
            >
              {saving || itemSaving ? 'Saving...' : 'Save Cards'}
            </button>
          </div>
        </form>
    </SectionEditorWorkspace>
  );
}

/* ============================================================
   CONTENT SECTION EDITOR
============================================================ */

function ContentSectionEditor({
  open,
  mode,
  section,
  categories,
  saving,
  error,
  onClose,
  onSave,
  onItemsSaved,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}) {
  const [form, setForm] = useState({
    section_key: '',
    section_type: '',
    title: '',
    subtitle: '',
    eyebrow: '',
    sort_order: 0,
    is_visible: true,
    publish_status: 'draft',
    selection_mode: 'manual',
    category_id: '',
    product_limit: 12,
    layout_config: '{}',
    content_config: '{}',
  });

  const [jsonError, setJsonError] = useState('');
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState('');
  const [itemForm, setItemForm] = useState({
    item_type: '',
    title: '',
    subtitle: '',
    description: '',
    eyebrow: '',
    image_url: '',
    mobile_image_url: '',
    video_url: '',
    alt_text: '',
    badge_text: '',
    badge_style: '',
    primary_cta_text: '',
    primary_cta_url: '',
    secondary_cta_text: '',
    secondary_cta_url: '',
    target_type: 'none',
    target_id: '',
    target_url: '',
    sort_order: 0,
    is_visible: true,
    publish_status: 'draft',
    style_config: '{}',
    metadata: '{}',
  });
  const [editingItemId, setEditingItemId] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      section_key: section?.section_key || '',
      section_type: section?.section_type || '',
      title: section?.title || '',
      subtitle: section?.subtitle || '',
      eyebrow: section?.eyebrow || '',
      sort_order: section?.sort_order ?? 0,
      is_visible: section?.is_visible ?? true,
      publish_status: section?.publish_status || 'draft',
      selection_mode: section?.selection_mode || 'manual',
      category_id: section?.category_id || '',
      product_limit: section?.product_limit ?? 12,
      layout_config: JSON.stringify(section?.layout_config || {}, null, 2),
      content_config: JSON.stringify(section?.content_config || {}, null, 2),
    });
    setJsonError('');
    setItemError('');
    setEditingItemId(null);
  }, [open, section]);

  if (!open) return null;

  const sectionAction = getWebSectionAction(section);

  if (
    sectionAction === 'shop-by-need' &&
    mode === 'edit'
  ) {
    return (
      <ShopByNeedSectionEditor
        open={open}
        section={section}
        categories={categories}
        saving={saving}
        error={error}
        onClose={onClose}
        onCreateItem={onCreateItem}
        onUpdateItem={(itemId, payload) =>
          onUpdateItem(itemId, payload, false)
        }
        onDeleteItem={onDeleteItem}
        onItemsSaved={onItemsSaved}
      />
    );
  }

  if (mode === 'items' && sectionAction === 'categories') {
    return (
      <ExploreCategoriesEditor
        open={open}
        section={section}
        categories={categories}
        saving={saving}
        error={error}
        onClose={onClose}
        onSave={onSave}
        onCreateItem={onCreateItem}
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
      />
    );
  }

  if (
    mode === 'items' &&
    ['category-campaigns', 'more-discovery'].includes(sectionAction)
  ) {
    return (
      <HomepageCardsEditor
        open={open}
        section={section}
        type={sectionAction}
        categories={categories}
        saving={saving}
        error={error}
        onClose={onClose}
        onCreateItem={onCreateItem}
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
        onItemsSaved={onItemsSaved}
      />
    );
  }

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateItemField = (key, value) => setItemForm((current) => ({ ...current, [key]: value }));

  const saveSection = async (event) => {
    event.preventDefault();
    setJsonError('');
    let layoutConfig;
    let contentConfig;
    try {
      layoutConfig = JSON.parse(form.layout_config || '{}');
      contentConfig = JSON.parse(form.content_config || '{}');
    } catch {
      setJsonError('Layout Config and Content Config must contain valid JSON.');
      return;
    }

    await onSave({
      section_key: form.section_key.trim(),
      section_type: form.section_type.trim(),
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      eyebrow: form.eyebrow.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_visible: Boolean(form.is_visible),
      publish_status: form.publish_status,
      selection_mode: form.selection_mode,
      category_id: form.category_id || null,
      product_limit: Number(form.product_limit) || null,
      layout_config: layoutConfig,
      content_config: contentConfig,
    });
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemForm({
      item_type: '', title: '', subtitle: '', description: '', eyebrow: '',
      image_url: '', mobile_image_url: '', video_url: '', alt_text: '',
      badge_text: '', badge_style: '', primary_cta_text: '', primary_cta_url: '',
      secondary_cta_text: '', secondary_cta_url: '', target_type: 'none', target_id: '',
      target_url: '', sort_order: Array.isArray(section?.items) ? section.items.length + 1 : 1,
      is_visible: true, publish_status: 'draft', style_config: '{}', metadata: '{}',
    });
    setItemError('');
  };

  const editItem = (item) => {
    setEditingItemId(item.id);
    setItemForm({
      item_type: item.item_type || '', title: item.title || '', subtitle: item.subtitle || '',
      description: item.description || '', eyebrow: item.eyebrow || '', image_url: item.image_url || '',
      mobile_image_url: item.mobile_image_url || '', video_url: item.video_url || '', alt_text: item.alt_text || '',
      badge_text: item.badge_text || '', badge_style: item.badge_style || '',
      primary_cta_text: item.primary_cta_text || '', primary_cta_url: item.primary_cta_url || '',
      secondary_cta_text: item.secondary_cta_text || '', secondary_cta_url: item.secondary_cta_url || '',
      target_type: item.target_type || 'none', target_id: item.target_id || '', target_url: item.target_url || '',
      sort_order: item.sort_order ?? 0, is_visible: item.is_visible ?? true,
      publish_status: item.publish_status || 'draft', style_config: JSON.stringify(item.style_config || {}, null, 2),
      metadata: JSON.stringify(item.metadata || {}, null, 2),
    });
    setItemError('');
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setItemSaving(true);
    setItemError('');
    try {
      const styleConfig = JSON.parse(itemForm.style_config || '{}');
      const metadata = JSON.parse(itemForm.metadata || '{}');
      const payload = {
        item_type: itemForm.item_type.trim(),
        title: itemForm.title.trim() || null,
        subtitle: itemForm.subtitle.trim() || null,
        description: itemForm.description.trim() || null,
        eyebrow: itemForm.eyebrow.trim() || null,
        image_url: itemForm.image_url.trim() || null,
        mobile_image_url: itemForm.mobile_image_url.trim() || null,
        video_url: itemForm.video_url.trim() || null,
        alt_text: itemForm.alt_text.trim() || null,
        badge_text: itemForm.badge_text.trim() || null,
        badge_style: itemForm.badge_style.trim() || null,
        primary_cta_text: itemForm.primary_cta_text.trim() || null,
        primary_cta_url: itemForm.primary_cta_url.trim() || null,
        secondary_cta_text: itemForm.secondary_cta_text.trim() || null,
        secondary_cta_url: itemForm.secondary_cta_url.trim() || null,
        target_type: itemForm.target_type || 'none',
        target_id: itemForm.target_id || null,
        target_url: itemForm.target_url.trim() || null,
        sort_order: Number(itemForm.sort_order) || 0,
        is_visible: Boolean(itemForm.is_visible),
        publish_status: itemForm.publish_status,
        style_config: styleConfig,
        metadata,
      };
      if (editingItemId) {
        await onUpdateItem(editingItemId, payload);
      } else {
        await onCreateItem(section.id, payload);
      }
      resetItemForm();
    } catch (error) {
      setItemError(error?.message || 'Unable to save item.');
    } finally {
      setItemSaving(false);
    }
  };

  const fieldStyle = { width: '100%', padding: '9px 10px', border: '1px solid #D9E0D6', borderRadius: 9, fontSize: 12, color: '#26352C', background: '#FFFFFF', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: 6, color: '#59645C', fontSize: 11, fontWeight: 700 };

  return (
    <SectionEditorWorkspace>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, color: '#123D2B', fontSize: 20 }}>{mode === 'create' ? 'Add Section' : mode === 'items' ? 'Manage Section Content' : 'Edit Section'}</h2>
            <p style={{ margin: '6px 0 0', color: '#77746C', fontSize: 12 }}>{section?.title || section?.section_key || 'New section'}</p>
          </div>
          <button type="button" onClick={onClose} style={{ width: 36, height: 36, border: '1px solid #D9E0D6', borderRadius: 9, background: '#FFFFFF', cursor: 'pointer' }}><X size={17} /></button>
        </div>

        {error && <Alert type="error" message={error} />}

        {mode !== 'items' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 20,
              alignItems: 'start',
            }}
          >
          <form onSubmit={saveSection} style={{ display: 'grid', gap: 14, padding: 20, border: '1px solid #E2E7DF', borderRadius: 14, background: '#FFFFFF' }}>
            {[
              ['section_key', 'Section Key', 'text'],
              ['section_type', 'Section Type', 'text'],
              ['title', 'Title', 'text'],
              ['subtitle', 'Subtitle', 'text'],
              ['eyebrow', 'Eyebrow', 'text'],
            ].map(([key, label, type]) => (
              <div key={key}><label style={labelStyle}>{label}</label><input type={type} value={form[key]} onChange={(e) => updateField(key, e.target.value)} style={fieldStyle} /></div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Sort Order</label><input type="number" min="0" value={form.sort_order} onChange={(e) => updateField('sort_order', e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Product Limit</label><input type="number" min="1" value={form.product_limit} onChange={(e) => updateField('product_limit', e.target.value)} style={fieldStyle} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Publish Status</label><select value={form.publish_status} onChange={(e) => updateField('publish_status', e.target.value)} style={fieldStyle}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
              <div><label style={labelStyle}>Selection Mode</label><input value={form.selection_mode} onChange={(e) => updateField('selection_mode', e.target.value)} style={fieldStyle} /></div>
            </div>
            <div><label style={labelStyle}>Category ID</label><input value={form.category_id} onChange={(e) => updateField('category_id', e.target.value)} style={fieldStyle} placeholder="Optional" /></div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#465149' }}><input type="checkbox" checked={form.is_visible} onChange={(e) => updateField('is_visible', e.target.checked)} /> Visible</label>
            <div><label style={labelStyle}>Layout Config (JSON)</label><textarea rows={7} value={form.layout_config} onChange={(e) => updateField('layout_config', e.target.value)} style={{ ...fieldStyle, fontFamily: 'monospace', resize: 'vertical' }} /></div>
            <div><label style={labelStyle}>Content Config (JSON)</label><textarea rows={7} value={form.content_config} onChange={(e) => updateField('content_config', e.target.value)} style={{ ...fieldStyle, fontFamily: 'monospace', resize: 'vertical' }} /></div>
            {jsonError && <Alert type="error" message={jsonError} />}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}><button type="button" onClick={onClose} style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid #D9E0D6', background: '#FFFFFF', cursor: 'pointer' }}>Cancel</button><button type="submit" disabled={saving} style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: '#123D2B', color: '#FFFFFF', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving...' : 'Save Section'}</button></div>
          </form>
          <section style={{ padding: 20, border: '1px solid #E2E7DF', borderRadius: 14, background: '#FFFFFF' }}>
            <h3 style={{ margin: '0 0 14px', color: '#123D2B', fontSize: 16 }}>Existing Section Items</h3>
            {(section?.items || []).length === 0 ? (
              <p style={{ margin: 0, color: '#77746C', fontSize: 12 }}>Save this section before adding content items.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {section.items.map((item) => (
                  <div key={item.id} style={{ padding: 12, border: '1px solid #E2E7DF', borderRadius: 10 }}>
                    <div style={{ color: '#123D2B', fontSize: 12, fontWeight: 700 }}>{item.title || item.item_key || item.item_type || 'Untitled item'}</div>
                    <div style={{ marginTop: 4, color: '#858A84', fontSize: 10 }}>{item.item_type || 'item'} · {item.publish_status || 'draft'} · Order {item.sort_order ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
          </div>
        )}

        {mode === 'items' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
            <section style={{ padding: 18, border: '1px solid #E2E7DF', borderRadius: 14, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div><div style={{ color: '#123D2B', fontSize: 14, fontWeight: 700 }}>Section Items</div><div style={{ color: '#77746C', fontSize: 11 }}>Manage the content records belonging to this section.</div></div>
              <button type="button" onClick={resetItemForm} style={{ padding: '8px 12px', borderRadius: 9, border: '1px solid #C9D7C5', background: '#F5F9F4', color: '#276345', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Add Item</button>
            </div>

            <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
              {(section?.items || []).map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '1px solid #E2E7DF', borderRadius: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ color: '#123D2B', fontSize: 12, fontWeight: 700 }}>{item.title || item.item_key || item.item_type || 'Untitled item'}</div><div style={{ color: '#858A84', fontSize: 10, marginTop: 4 }}>{item.item_type || 'item'} · {item.publish_status || 'draft'} · Order {item.sort_order ?? 0}</div></div>
                  <button type="button" onClick={() => editItem(item)} style={{ width: 34, height: 34, border: '1px solid #DCE8D9', borderRadius: 8, background: '#F7FAF6', color: '#276345', cursor: 'pointer' }}><Pencil size={14} /></button>
                  <button type="button" onClick={() => onDeleteItem(item.id)} style={{ width: 34, height: 34, border: '1px solid #F0C7C3', borderRadius: 8, background: '#FFF6F5', color: '#A3332A', cursor: 'pointer' }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            </section>

            <form onSubmit={saveItem} style={{ display: 'grid', gap: 12, padding: 18, border: '1px solid #E2E7DF', borderRadius: 14, background: '#FFFFFF' }}>
              {[
                ['item_type', 'Item Type'], ['title', 'Title'], ['subtitle', 'Subtitle'], ['description', 'Description'], ['eyebrow', 'Eyebrow'],
                ['image_url', 'Image URL'], ['mobile_image_url', 'Mobile Image URL'], ['video_url', 'Video URL'], ['alt_text', 'Alt Text'],
                ['badge_text', 'Badge Text'], ['badge_style', 'Badge Style'], ['primary_cta_text', 'Primary CTA Text'], ['primary_cta_url', 'Primary CTA URL'],
                ['secondary_cta_text', 'Secondary CTA Text'], ['secondary_cta_url', 'Secondary CTA URL'], ['target_id', 'Target ID'], ['target_url', 'Target URL'],
              ].map(([key, label]) => (
                <div key={key}><label style={labelStyle}>{label}</label><input value={itemForm[key]} onChange={(e) => updateItemField(key, e.target.value)} style={fieldStyle} /></div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label style={labelStyle}>Target Type</label><input value={itemForm.target_type} onChange={(e) => updateItemField('target_type', e.target.value)} style={fieldStyle} /></div>
                <div><label style={labelStyle}>Sort Order</label><input type="number" value={itemForm.sort_order} onChange={(e) => updateItemField('sort_order', e.target.value)} style={fieldStyle} /></div>
                <div><label style={labelStyle}>Publish Status</label><select value={itemForm.publish_status} onChange={(e) => updateItemField('publish_status', e.target.value)} style={fieldStyle}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#465149' }}><input type="checkbox" checked={itemForm.is_visible} onChange={(e) => updateItemField('is_visible', e.target.checked)} /> Visible</label>
              <div><label style={labelStyle}>Style Config (JSON)</label><textarea rows={5} value={itemForm.style_config} onChange={(e) => updateItemField('style_config', e.target.value)} style={{ ...fieldStyle, fontFamily: 'monospace', resize: 'vertical' }} /></div>
              <div><label style={labelStyle}>Metadata (JSON)</label><textarea rows={5} value={itemForm.metadata} onChange={(e) => updateItemField('metadata', e.target.value)} style={{ ...fieldStyle, fontFamily: 'monospace', resize: 'vertical' }} /></div>
              {itemError && <Alert type="error" message={itemError} />}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button type="button" onClick={resetItemForm} style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid #D9E0D6', background: '#FFFFFF', cursor: 'pointer' }}>Clear</button><button type="submit" disabled={itemSaving || !section?.id} style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: '#123D2B', color: '#FFFFFF', fontWeight: 700, cursor: itemSaving ? 'not-allowed' : 'pointer' }}>{itemSaving ? 'Saving...' : editingItemId ? 'Update Item' : 'Create Item'}</button></div>
            </form>
          </div>
        )}
    </SectionEditorWorkspace>
  );
}


function ShopByNeedSectionEditor({
  open,
  section,
  categories,
  saving,
  error,
  onClose,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onItemsSaved,
}) {
  const [cards, setCards] = useState([]);
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState('');
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (!open) return;

    const sourceItems = Array.isArray(section?.items)
      ? [...section.items].sort(
          (a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0)
        )
      : [];

    setCards(
      Array.from({ length: 4 }, (_, index) => {
        const item = sourceItems[index];
        return {
          id: item?.id || null,
          item_type: item?.item_type || 'category_tile',
          category_id:
            item?.target_type === 'category'
              ? String(item.target_id || '')
              : '',
          title: item?.title || '',
          subtitle: item?.subtitle || '',
          image_url: item?.image_url || '',
          image_file: null,
          sort_order: item?.sort_order ?? index + 1,
          publish_status: item?.publish_status || 'published',
        };
      })
    );

    setItemError('');
    setImageError('');
  }, [open, section]);

  if (!open) return null;

  const categoryOptions = flattenWebCategories(categories);

  const updateCard = (index, key, value) => {
    setCards((current) =>
      current.map((card, cardIndex) =>
        cardIndex === index
          ? { ...card, [key]: value }
          : card
      )
    );
  };

  const handleCategoryChange = (index, categoryId) => {
    const category = categoryOptions.find(
      (item) => String(item.id) === String(categoryId)
    );

    setCards((current) =>
      current.map((card, cardIndex) =>
        cardIndex === index
          ? {
              ...card,
              category_id: categoryId,
              title: category?.name || card.title,
            }
          : card
      )
    );
  };

  const handleImageChange = (index, file) => {
    const validationMessage = validateHomepageImage(file);
    setImageError(validationMessage);
    if (validationMessage) return;
    updateCard(index, 'image_file', file || null);
  };

  const save = async (event) => {
    event.preventDefault();
    setItemError('');

    const categoryIds = cards.map((card) => card.category_id);
    if (
      cards.length !== 4 ||
      categoryIds.some((id) => !id) ||
      new Set(categoryIds).size !== 4
    ) {
      setItemError(
        'Select a different category for each of the 4 cards.'
      );
      return;
    }

    if (imageError) {
      setItemError(imageError);
      return;
    }

    const extraItems = [...(section?.items || [])]
      .sort(
        (left, right) =>
          Number(left.sort_order || 0) -
          Number(right.sort_order || 0)
      )
      .slice(4);
    if (
      extraItems.length > 0 &&
      !window.confirm(
        `This section allows 4 cards. Remove ${extraItems.length} extra card(s)?`
      )
    ) {
      return;
    }

    try {
      setItemSaving(true);

      for (const [index, card] of cards.entries()) {
        const category = categoryOptions.find(
          (item) => String(item.id) === String(card.category_id)
        );

        let imageUrl = card.image_url;
        if (card.image_file) {
          const uploadResponse =
            await uploadContentManagementImage(
              section.id,
              card.image_file
            );
          imageUrl = getUploadedImageUrl(uploadResponse);
          if (!imageUrl) {
            throw new Error('Image upload did not return an image URL.');
          }
        }

        const payload = {
          item_key: `shop-by-need-${index + 1}`,
          item_type: card.item_type || 'category_tile',
          title: category?.name || null,
          subtitle: card.subtitle.trim() || null,
          image_url: imageUrl || null,
          target_type: 'category',
          target_id: card.category_id,
          target_url: null,
          primary_cta_text: null,
          primary_cta_url: null,
          sort_order: Number(card.sort_order) || index + 1,
          is_visible: true,
          publish_status: card.publish_status || 'published',
        };
        if (card.id) {
          await onUpdateItem(card.id, payload, false);
        } else {
          await onCreateItem(section.id, payload, false);
        }
      }

      for (const item of extraItems) {
        await onDeleteItem(item.id, false, false);
      }

      await onItemsSaved();
    } catch (saveError) {
      setItemError(
        saveError?.message || 'Unable to save Wellness for Every Part of You.'
      );
    } finally {
      setItemSaving(false);
    }
  };

  const fieldStyle = {
    width: '100%',
    padding: '9px 10px',
    border: '1px solid #D9E0D6',
    borderRadius: 9,
    fontSize: 12,
    color: '#26352C',
    background: '#FFFFFF',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    color: '#59645C',
    fontSize: 11,
    fontWeight: 700,
  };

  return (
    <SectionEditorWorkspace>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#123D2B', fontSize: 20 }}>
              Edit Wellness for Every Part of You
            </h2>
            <p style={{ margin: '6px 0 0', color: '#77746C', fontSize: 12 }}>
              Each card has its own homepage image. Category master images are not changed.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving || itemSaving}
            style={{
              width: 36,
              height: 36,
              border: '1px solid #D9E0D6',
              borderRadius: 9,
              background: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {(error || itemError || imageError) && (
          <Alert
            type="error"
            message={itemError || imageError || error}
          />
        )}

        <form onSubmit={save}>
          <section
            style={{
              border: '1px solid #E2E7DF',
              borderRadius: 14,
              padding: 14,
              background: '#FCFDFC',
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: '#123D2B', fontSize: 14, fontWeight: 700 }}>
                Section Content
              </div>
              <div style={{ color: '#77746C', fontSize: 11, marginTop: 4 }}>
                Exactly 4 category cards. Images belong to this section only.
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 12,
                alignItems: 'start',
              }}
            >
            {cards.map((card, index) => (
              <div
                key={card.id || `shop-by-need-${index}`}
                style={{
                  border: '1px solid #E2E7DF',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  background: '#FFFFFF',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: '#F1F7F0',
                      color: '#276345',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </div>
                  <strong style={{ color: '#123D2B', fontSize: 13 }}>
                    Card {index + 1}
                  </strong>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 110px',
                    gap: 12,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select
                      value={card.category_id}
                      onChange={(event) =>
                        handleCategoryChange(index, event.target.value)
                      }
                      style={fieldStyle}
                    >
                      <option value="">Select category</option>
                      {categoryOptions.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Sort Order</label>
                    <input
                      type="number"
                      min="1"
                      value={card.sort_order}
                      onChange={(event) =>
                        updateCard(index, 'sort_order', event.target.value)
                      }
                      style={fieldStyle}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Card Title</label>
                  <input
                    value={card.title}
                    readOnly
                    style={{
                      ...fieldStyle,
                      background: '#F5F7F4',
                      color: '#6B746D',
                    }}
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Subtitle</label>
                  <input
                    value={card.subtitle}
                    onChange={(event) =>
                      updateCard(index, 'subtitle', event.target.value)
                    }
                    placeholder="Healthy hair, naturally"
                    style={fieldStyle}
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Homepage Image</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      handleImageChange(index, event.target.files?.[0])
                    }
                    style={fieldStyle}
                  />
                  {card.image_file && (
                    <span
                      style={{
                        display: 'block',
                        marginTop: 6,
                        color: '#77746C',
                        fontSize: 11,
                      }}
                    >
                      Selected: {card.image_file.name}
                    </span>
                  )}
                </div>

                {card.image_url && (
                  <div style={{ marginTop: 10 }}>
                    <img
                      src={card.image_url}
                      alt=""
                      style={{
                        width: '100%',
                        maxHeight: 170,
                        objectFit: 'cover',
                        borderRadius: 9,
                        border: '1px solid #E5E9E3',
                        background: '#F4F5F2',
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            </div>

          </section>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #EDF0EB',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving || itemSaving}
              style={{
                padding: '9px 14px',
                borderRadius: 9,
                border: '1px solid #D9E0D6',
                background: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || itemSaving || Boolean(imageError)}
              style={{
                padding: '9px 16px',
                borderRadius: 9,
                border: 'none',
                background: '#123D2B',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: saving || itemSaving ? 'not-allowed' : 'pointer',
                opacity: saving || itemSaving ? 0.65 : 1,
              }}
            >
              {itemSaving || saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
    </SectionEditorWorkspace>
  );
}


/* ============================================================
   BANNER TYPE SELECTION
============================================================ */

function BannerTypeSelection({
  platform,
  types,
  onBack,
  onSelect,
}) {
  return (
    <>
      <BackButton
        label="Back to Platforms"
        onClick={onBack}
      />

      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E7DF',
          borderRadius: 18,
          padding: 24,
          boxShadow:
            '0 8px 28px rgba(18,61,43,0.05)',
        }}
      >
        <div
          style={{
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              color: '#123D2B',
            }}
          >
            {platform === 'app'
              ? 'App Banner Types'
              : 'Web Banner Types'}
          </h2>

          <p
            style={{
              margin: '6px 0 0',
              color: '#77746C',
              fontSize: 13,
            }}
          >
            Choose the type of banner you
            want to manage.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 16,
          }}
        >
          {types.map((item) => (
            <NavigationCard
              key={item.id}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() =>
                onSelect(item.id)
              }
            />
          ))}
        </div>
      </section>
    </>
  );
}

/* ============================================================
   NAVIGATION CARD
============================================================ */

function NavigationCard({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 20,
        borderRadius: 16,
        border: '1px solid #E2E7DF',
        background: '#FFFFFF',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow:
          '0 5px 18px rgba(18,61,43,0.035)',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor =
          '#BFD3BA';

        event.currentTarget.style.transform =
          'translateY(-2px)';

        event.currentTarget.style.boxShadow =
          '0 10px 26px rgba(18,61,43,0.08)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor =
          '#E2E7DF';

        event.currentTarget.style.transform =
          'translateY(0)';

        event.currentTarget.style.boxShadow =
          '0 5px 18px rgba(18,61,43,0.035)';
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#EAF3E8',
          color: '#276345',
          marginBottom: 14,
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: 0,
          color: '#123D2B',
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: '7px 0 0',
          color: '#77746C',
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      <div
        style={{
          marginTop: 15,
          color: '#276345',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        Manage →
      </div>
    </button>
  );
}

/* ============================================================
   BACK BUTTON
============================================================ */

function BackButton({
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        marginBottom: 18,
        padding: '8px 12px',
        borderRadius: 9,
        border: '1px solid #D8DED6',
        background: '#FFFFFF',
        color: '#4F574F',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  );
}

/* ============================================================
   APP BANNER MANAGEMENT
============================================================ */

function AppBannerManagement({
  banners,
  loading,
  saving,
  error,
  success,
  previewUrl,
  dragActive,
  setDragActive,
  fileInputRef,
  form,
  handleFileChange,
  handleDrop,
  handleChange,
  removeImage,
  resetForm,
  handleSubmit,
  onStartEdit,
  editingBanner,
  editSaving,
  onCloseEdit,
  onEditBanner,
  onDeleteBanner,
  deleteSaving,
  deleteBannerId,
  publishedCount,
  draftCount,
  getStatusStyle,
}) {
  return (
    <>
      {/* ERROR */}

      {error && (
        <Alert
          type="error"
          message={error}
        />
      )}

      {/* SUCCESS */}

      {success && (
        <Alert
          type="success"
          message={success}
        />
      )}

      {/* STATS */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <StatCard
          icon={<Images size={19} />}
          label="Total Banners"
          value={banners.length}
        />

        <StatCard
          icon={
            <CheckCircle2 size={19} />
          }
          label="Published"
          value={publishedCount}
        />

        <StatCard
          icon={<Clock3 size={19} />}
          label="Drafts"
          value={draftCount}
        />
      </div>

      {/* ADD APP BANNER */}

      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E7DF',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow:
            '0 8px 28px rgba(18,61,43,0.05)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: '20px 22px',
            borderBottom:
              '1px solid #EDF0EB',
            background:
              'linear-gradient(135deg, #FBFCFA 0%, #F5F8F3 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#EAF3E8',
                color: '#276345',
              }}
            >
              <ImagePlus size={19} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  color: '#123D2B',
                }}
              >
                Add App Banner
              </h2>

              <p
                style={{
                  margin: '4px 0 0',
                  color: '#77746C',
                  fontSize: 12,
                }}
              >
                Upload a 7:3 promotional
                banner for the customer app.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: 22 }}>
            <ImageUploadBox
              previewUrl={previewUrl}
              file={form.image}
              dragActive={dragActive}
              setDragActive={setDragActive}
              fileInputRef={fileInputRef}
              handleFileChange={
                handleFileChange
              }
              handleDrop={handleDrop}
              removeImage={removeImage}
              ratioText="JPG · PNG · WEBP · 7:3 ratio · Max 10 MB"
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 16,
                marginTop: 20,
              }}
            >
              <FormField
                label="Display Location"
                required
              >
                <select
                  name="display_location"
                  value={
                    form.display_location
                  }
                  onChange={
                    handleChange
                  }
                  style={inputStyle}
                >
                  {DISPLAY_LOCATIONS.map(
                    (location) => (
                      <option
                        key={location}
                        value={location}
                      >
                        {location}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField
                label="Display Order"
                required
              >
                <input
                  name="display_order"
                  type="number"
                  min="1"
                  value={
                    form.display_order
                  }
                  onChange={
                    handleChange
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField
                label="Status"
                required
              >
                <select
                  name="publish_status"
                  value={
                    form.publish_status
                  }
                  onChange={
                    handleChange
                  }
                  style={inputStyle}
                >
                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {capitalize(status)}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField label="Start Date">
                <input
                  name="starts_at"
                  type="datetime-local"
                  value={
                    form.starts_at
                  }
                  onChange={
                    handleChange
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="End Date">
                <input
                  name="ends_at"
                  type="datetime-local"
                  value={
                    form.ends_at
                  }
                  onChange={
                    handleChange
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormActions
              saving={saving}
              onClear={resetForm}
              saveText="Save Banner"
            />
          </div>
        </form>
      </section>

      {/* EXISTING APP BANNERS */}

      <ExistingBanners
        banners={banners}
        loading={loading}
        getStatusStyle={getStatusStyle}
        onEdit={onStartEdit}
        onDelete={onDeleteBanner}
        deleteSaving={deleteSaving}
        deleteBannerId={deleteBannerId}
      />
      {editingBanner && (
        <WebMainPromoEditModal
          key={editingBanner.id}
          banner={editingBanner}
          saving={editSaving}
          bannerLabel="App Promotional Banner"
          onClose={onCloseEdit}
          onSave={onEditBanner}
        />
      )}
    </>
  );
}

/* ============================================================
   CATEGORY BANNER MANAGEMENT
============================================================ */

function CategoryBannerManagement({
  categories,
  lockedCategoryId,
  categoryBanners,
  categoryLoading,
  categorySaving,
  categoryError,
  categorySuccess,
  categoryPreviewUrl,
  categoryDragActive,
  setCategoryDragActive,
  categoryFileInputRef,
  categoryForm,
  handleCategoryFileChange,
  handleCategoryDrop,
  handleCategoryChange,
  removeCategoryImage,
  resetCategoryForm,
  handleCategorySubmit,
  editingCategoryBannerId,
  onEditCategoryBanner,
  onDeleteCategoryBanner,
  deleteSaving,
  deleteBannerId,
  getStatusStyle,
}) {
  return (
    <>
      {/* ERROR */}

      {categoryError && (
        <Alert
          type="error"
          message={categoryError}
        />
      )}

      {/* SUCCESS */}

      {categorySuccess && (
        <Alert
          type="success"
          message={categorySuccess}
        />
      )}

      {/* CATEGORY BANNER FORM */}

      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E7DF',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow:
            '0 8px 28px rgba(18,61,43,0.05)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: '20px 22px',
            borderBottom:
              '1px solid #EDF0EB',
            background:
              'linear-gradient(135deg, #FBFCFA 0%, #F5F8F3 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#EAF3E8',
                color: '#276345',
              }}
            >
              <LayoutGrid size={19} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  color: '#123D2B',
                }}
              >
                {editingCategoryBannerId
                  ? 'Edit App Category Banner'
                  : 'Add App Category Banner'}
              </h2>

              <p
                style={{
                  margin: '4px 0 0',
                  color: '#77746C',
                  fontSize: 12,
                }}
              >
                Upload the large promotional
                banner shown after selecting a
                category.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleCategorySubmit}
        >
          <div style={{ padding: 22 }}>
            {/* CATEGORY */}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <FormField
                label="Category"
                required
              >
                <select
                  name="category_id"
                  value={
                    categoryForm.category_id
                  }
                  onChange={
                    handleCategoryChange
                  }
                  disabled={Boolean(lockedCategoryId)}
                  style={inputStyle}
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField
                label="Display Order"
                required
              >
                <input
                  name="display_order"
                  type="number"
                  min="1"
                  value={
                    categoryForm.display_order
                  }
                  onChange={
                    handleCategoryChange
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField
                label="Status"
                required
              >
                <select
                  name="publish_status"
                  value={
                    categoryForm.publish_status
                  }
                  onChange={
                    handleCategoryChange
                  }
                  style={inputStyle}
                >
                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {capitalize(status)}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField label="Start Date">
                <input
                  name="starts_at"
                  type="datetime-local"
                  value={
                    categoryForm.starts_at
                  }
                  onChange={
                    handleCategoryChange
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="End Date">
                <input
                  name="ends_at"
                  type="datetime-local"
                  value={
                    categoryForm.ends_at
                  }
                  onChange={
                    handleCategoryChange
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            {/* IMAGE */}

            <ImageUploadBox
              previewUrl={
                categoryPreviewUrl
              }
              file={
                categoryForm.image
              }
              dragActive={
                categoryDragActive
              }
              setDragActive={
                setCategoryDragActive
              }
              fileInputRef={
                categoryFileInputRef
              }
              handleFileChange={
                handleCategoryFileChange
              }
              handleDrop={
                handleCategoryDrop
              }
              removeImage={
                removeCategoryImage
              }
              ratioText="JPG · PNG · WEBP · 3:1 ratio · Max 10 MB"
            />

            {/* ACTIONS */}

            <FormActions
              saving={categorySaving}
              onClear={
                resetCategoryForm
              }
              saveText={
                editingCategoryBannerId
                  ? 'Update Category Banner'
                  : 'Save Category Banner'
              }
            />
          </div>
        </form>
      </section>

      {/* EXISTING CATEGORY BANNERS */}

      <ExistingCategoryBanners
        banners={categoryBanners}
        loading={categoryLoading}
        getStatusStyle={getStatusStyle}
        onEdit={onEditCategoryBanner}
        onDelete={onDeleteCategoryBanner}
        deleteSaving={deleteSaving}
        deleteBannerId={deleteBannerId}
      />
    </>
  );
}

/* ============================================================
   IMAGE UPLOAD BOX
============================================================ */

function ImageUploadBox({
  previewUrl,
  file,
  dragActive,
  setDragActive,
  fileInputRef,
  handleFileChange,
  handleDrop,
  removeImage,
  ratioText,
}) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() =>
        setDragActive(false)
      }
      onDrop={handleDrop}
      onClick={() => {
        if (!previewUrl) {
          fileInputRef.current?.click();
        }
      }}
      style={{
        position: 'relative',
        minHeight: previewUrl
          ? 250
          : 210,
        borderRadius: 15,
        border: dragActive
          ? '2px solid #276345'
          : '1.5px dashed #C9D7C6',
        background: dragActive
          ? '#F2F8F0'
          : '#FAFCF9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: previewUrl
          ? 'default'
          : 'pointer',
        transition:
          'all 0.2s ease',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={
          handleFileChange
        }
        style={{
          display: 'none',
        }}
      />

      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt="Banner preview"
            style={{
              width: '100%',
              height: '100%',
              maxHeight: 280,
              objectFit: 'cover',
              display: 'block',
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              background:
                'rgba(18,61,43,0.88)',
              color: '#FFFFFF',
              backdropFilter:
                'blur(8px)',
            }}
          >
            <div
              style={{
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow:
                    'ellipsis',
                  whiteSpace:
                    'nowrap',
                }}
              >
                {file?.name}
              </div>

              <div
                style={{
                  marginTop: 2,
                  fontSize: 10,
                  opacity: 0.75,
                }}
              >
                {file?.size
                  ? (
                      file.size /
                      1024 /
                      1024
                    ).toFixed(2)
                  : '0.00'}{' '}
                MB
              </div>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeImage();
              }}
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: 8,
                border:
                  '1px solid rgba(255,255,255,0.22)',
                background:
                  'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 15,
              margin:
                '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'center',
              background: '#EAF3E8',
              color: '#276345',
            }}
          >
            <UploadCloud
              size={24}
            />
          </div>

          <div
            style={{
              color: '#123D2B',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Drop your banner here
          </div>

          <div
            style={{
              marginTop: 5,
              color: '#77746C',
              fontSize: 12,
            }}
          >
            or click to browse from
            your computer
          </div>

          <div
            style={{
              display:
                'inline-flex',
              marginTop: 13,
              padding: '6px 10px',
              borderRadius: 999,
              background: '#FFFFFF',
              border:
                '1px solid #DDE6DA',
              color: '#5F675F',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {ratioText}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   EXISTING APP BANNERS
============================================================ */

function ExistingBanners({
  banners,
  loading,
  getStatusStyle,
  onEdit,
  onDelete,
  deleteSaving = false,
  deleteBannerId = null,
  title = 'Existing Banners',
  description = 'Banners currently configured for the app.',
  emptyTitle = 'No banners yet',
  emptyDescription = 'Upload your first app banner above.',
  bannerFallback = 'App Banner',
  subtitleFallback = 'AUMVEDA App',
  headerAction = null,
}) {
  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E7DF',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow:
          '0 8px 28px rgba(18,61,43,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          paddingRight: 18,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <SectionHeader
            title={title}
            description={description}
            count={banners.length}
            countLabel={
              banners.length === 1
                ? 'Banner'
                : 'Banners'
            }
          />
        </div>
        {headerAction}
      </div>

      <div style={{ padding: 22 }}>
        {loading ? (
          <LoadingState />
        ) : banners.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 18,
            }}
          >
            {banners.map(
              (banner) => {
                const statusStyle =
                  getStatusStyle(
                    banner.publish_status
                  );

                return (
                  <BannerCard
                    key={banner.id}
                    banner={banner}
                    statusStyle={
                      statusStyle
                    }
                    ratio="4.4 / 1"
                    ratioLabel="4.4:1 Banner"
                    title={
                      banner.title ||
                      banner.metadata
                        ?.display_location ||
                      bannerFallback
                    }
                    subtitle={
                      banner.metadata
                        ?.display_location ||
                      subtitleFallback
                    }
                    onEdit={onEdit ? () => onEdit(banner) : null}
                    onDelete={onDelete ? () => onDelete(banner.id) : null}
                    deleting={
                      deleteSaving &&
                      deleteBannerId === banner.id
                    }
                  />
                );
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   EXISTING CATEGORY BANNERS
============================================================ */

function ExistingCategoryBanners({
  banners,
  loading,
  getStatusStyle,
  onEdit,
  onDelete,
  deleteSaving = false,
  deleteBannerId = null,
}) {
  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E7DF',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow:
          '0 8px 28px rgba(18,61,43,0.05)',
      }}
    >
      <SectionHeader
        title="Existing Category Banners"
        description="Large promotional banners assigned to app categories."
        count={banners.length}
        countLabel={
          banners.length === 1
            ? 'Banner'
            : 'Banners'
        }
      />

      <div style={{ padding: 22 }}>
        {loading ? (
          <LoadingState />
        ) : banners.length === 0 ? (
          <EmptyState
            title="No category banners yet"
            description="Upload a category banner above."
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 18,
            }}
          >
            {banners.map(
              (banner) => {
                const statusStyle =
                  getStatusStyle(
                    banner.publish_status
                  );

                const categoryName =
                  banner.categories
                    ?.name ||
                  banner.title ||
                  'Category Banner';

                return (
                  <BannerCard
                    key={banner.id}
                    banner={banner}
                    statusStyle={
                      statusStyle
                    }
                    ratio="3 / 1"
                    ratioLabel="3:1 Banner"
                    title={
                      categoryName
                    }
                    subtitle={
                      banner.categories
                        ?.slug ||
                      'App Category'
                    }
                    onEdit={onEdit ? () => onEdit(banner) : null}
                    onDelete={onDelete ? () => onDelete(banner.id) : null}
                    deleting={
                      deleteSaving &&
                      deleteBannerId === banner.id
                    }
                  />
                );
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   BANNER CARD
============================================================ */

function BannerCard({
  banner,
  statusStyle,
  ratio,
  ratioLabel,
  title,
  subtitle,
  onEdit,
  onDelete,
  deleting = false,
}) {
  return (
    <article
      style={{
        border:
          '1px solid #E2E7DF',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#FFFFFF',
        boxShadow:
          '0 5px 18px rgba(18,61,43,0.04)',
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: ratio,
          background: '#F2F4F1',
          overflow: 'hidden',
        }}
      >
        {banner.image_url ? (
          <img
            src={banner.image_url}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'center',
              padding: 18,
              color: '#31553E',
              background:
                'linear-gradient(110deg, #E9F0DF 0%, #FAF6E9 100%)',
              fontSize: 18,
              fontWeight: 700,
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {banner.title || 'Text-only banner'}
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            padding: '5px 9px',
            borderRadius: 999,
            background:
              'rgba(255,255,255,0.92)',
            color: '#123D2B',
            fontSize: 10,
            fontWeight: 800,
            boxShadow:
              '0 3px 10px rgba(0,0,0,0.08)',
          }}
        >
          #{banner.sort_order}
        </div>
      </div>

      <div style={{ padding: 15 }}>
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'flex-start',
            gap: 10,
          }}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: '#123D2B',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {title}
            </h3>

            <p
              style={{
                margin: '5px 0 0',
                color: '#77746C',
                fontSize: 11,
              }}
            >
              {subtitle}
            </p>
          </div>

          <span
            style={{
              flexShrink: 0,
              padding: '5px 8px',
              borderRadius: 999,
              background:
                statusStyle.background,
              color:
                statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
              fontSize: 9,
              fontWeight: 800,
              textTransform:
                'uppercase',
              letterSpacing:
                '0.04em',
            }}
          >
            {banner.publish_status}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'space-between',
            gap: 10,
            marginTop: 14,
            paddingTop: 12,
            borderTop:
              '1px solid #EDF0EB',
            color: '#77746C',
            fontSize: 10,
          }}
        >
          <span>
            Display order:{' '}
            <strong
              style={{
                color: '#123D2B',
              }}
            >
              {banner.sort_order}
            </strong>
          </span>

          <span>
            {ratioLabel}
          </span>
        </div>

        {(onEdit || onDelete) && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
            }}
          >
            {onEdit && (
              <button
                type="button"
                className="secondary-button"
                onClick={onEdit}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 40,
                  padding: '0 15px',
                  color: '#A3332A',
                  background: '#FFF5F4',
                  border: '1px solid #F0C7C3',
                  borderRadius: 11,
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   FORM ACTIONS
============================================================ */

function FormActions({
  saving,
  onClear,
  saveText,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'flex-end',
        gap: 10,
        marginTop: 22,
        paddingTop: 18,
        borderTop:
          '1px solid #EDF0EB',
      }}
    >
      <button
        type="button"
        onClick={onClear}
        disabled={saving}
        style={{
          padding: '10px 17px',
          borderRadius: 9,
          border:
            '1px solid #D8DED6',
          background: '#FFFFFF',
          color: '#4F574F',
          fontSize: 12,
          fontWeight: 700,
          cursor: saving
            ? 'not-allowed'
            : 'pointer',
          opacity: saving
            ? 0.6
            : 1,
        }}
      >
        Clear
      </button>

      <button
        type="submit"
        disabled={saving}
        style={{
          minWidth: 145,
          padding: '10px 18px',
          borderRadius: 9,
          border:
            '1px solid #123D2B',
          background: '#123D2B',
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 700,
          cursor: saving
            ? 'not-allowed'
            : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent:
            'center',
          gap: 8,
          boxShadow:
            '0 5px 14px rgba(18,61,43,0.16)',
          opacity: saving
            ? 0.75
            : 1,
        }}
      >
        {saving ? (
          <>
            <Loader2
              size={15}
              style={{
                animation:
                  'banner-spin 0.9s linear infinite',
              }}
            />

            Uploading...
          </>
        ) : (
          <>
            <UploadCloud
              size={15}
            />

            {saveText}
          </>
        )}
      </button>
    </div>
  );
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
  title,
  description,
  count,
  countLabel,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'space-between',
        alignItems: 'center',
        gap: 16,
        padding: '20px 22px',
        borderBottom:
          '1px solid #EDF0EB',
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            color: '#123D2B',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: '4px 0 0',
            color: '#77746C',
            fontSize: 12,
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          padding: '7px 11px',
          borderRadius: 999,
          background: '#F3F7F1',
          border:
            '1px solid #DCE8D9',
          color: '#276345',
          fontSize: 11,
          fontWeight: 700,
          whiteSpace:
            'nowrap',
        }}
      >
        {count} {countLabel}
      </div>
    </div>
  );
}

/* ============================================================
   ALERT
============================================================ */

function Alert({
  type,
  message,
}) {
  const isSuccess =
    type === 'success';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          'space-between',
        gap: 16,
        padding: '13px 16px',
        marginBottom: 18,
        borderRadius: 12,
        background: isSuccess
          ? '#EEF8F0'
          : '#FFF4F2',
        border: isSuccess
          ? '1px solid #CDE5D2'
          : '1px solid #F4D0CA',
        color: isSuccess
          ? '#17663D'
          : '#A3332A',
        fontSize: 13,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems:
            'center',
          gap: 9,
        }}
      >
        {isSuccess && (
          <CheckCircle2
            size={17}
          />
        )}

        <span>{message}</span>
      </div>
    </div>
  );
}

/* ============================================================
   LOADING STATE
============================================================ */

function LoadingState() {
  return (
    <div
      style={{
        minHeight: 180,
        display: 'flex',
        flexDirection:
          'column',
        alignItems:
          'center',
        justifyContent:
          'center',
        gap: 10,
        color: '#77746C',
      }}
    >
      <Loader2
        size={22}
        style={{
          animation:
            'banner-spin 0.9s linear infinite',
          color: '#276345',
        }}
      />

      <span
        style={{
          fontSize: 12,
        }}
      >
        Loading banners...
      </span>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  title,
  description,
}) {
  return (
    <div
      style={{
        minHeight: 210,
        display: 'flex',
        flexDirection:
          'column',
        alignItems:
          'center',
        justifyContent:
          'center',
        textAlign: 'center',
        border:
          '1px dashed #D7E0D4',
        borderRadius: 14,
        background: '#FAFCF9',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          display: 'flex',
          alignItems:
            'center',
          justifyContent:
            'center',
          background: '#EAF3E8',
          color: '#276345',
          marginBottom: 12,
        }}
      >
        <Images size={22} />
      </div>

      <div
        style={{
          color: '#123D2B',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 5,
          color: '#77746C',
          fontSize: 12,
        }}
      >
        {description}
      </div>
    </div>
  );
}

/* ============================================================
   COMING SOON
============================================================ */

function ComingSoon({
  title,
  description,
}) {
  return (
    <section
      style={{
        background: '#FFFFFF',
        border:
          '1px solid #E2E7DF',
        borderRadius: 18,
        padding: 50,
        textAlign: 'center',
        boxShadow:
          '0 8px 28px rgba(18,61,43,0.05)',
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          margin:
            '0 auto 16px',
          borderRadius: 17,
          display: 'flex',
          alignItems:
            'center',
          justifyContent:
            'center',
          background: '#EAF3E8',
          color: '#276345',
        }}
      >
        <Images size={27} />
      </div>

      <h2
        style={{
          margin: 0,
          color: '#123D2B',
          fontSize: 20,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          maxWidth: 520,
          margin:
            '8px auto 0',
          color: '#77746C',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      <div
        style={{
          display:
            'inline-flex',
          marginTop: 18,
          padding:
            '7px 12px',
          borderRadius: 999,
          background: '#FFF7E6',
          border:
            '1px solid #F1DCA8',
          color: '#9A6910',
          fontSize: 10,
          fontWeight: 800,
          textTransform:
            'uppercase',
          letterSpacing:
            '0.06em',
        }}
      >
        Coming Soon
      </div>
    </section>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div
      style={{
        padding:
          '16px 17px',
        borderRadius: 14,
        background: '#FFFFFF',
        border:
          '1px solid #E2E7DF',
        display: 'flex',
        alignItems:
          'center',
        gap: 12,
        boxShadow:
          '0 5px 18px rgba(18,61,43,0.035)',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          display: 'flex',
          alignItems:
            'center',
          justifyContent:
            'center',
          background: '#EAF3E8',
          color: '#276345',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: '#77746C',
            fontSize: 10,
            fontWeight: 600,
            textTransform:
              'uppercase',
            letterSpacing:
              '0.05em',
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: 2,
            color: '#123D2B',
            fontSize: 20,
            fontWeight: 750,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function FormField({
  label,
  required,
  children,
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection:
          'column',
        gap: 7,
      }}
    >
      <span
        style={{
          color: '#39443C',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {label}

        {required && (
          <span
            style={{
              color: '#B88924',
              marginLeft: 3,
            }}
          >
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function capitalize(value) {
  if (!value) return '';

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

/* ============================================================
   INPUT STYLE
============================================================ */

const inputStyle = {
  width: '100%',
  minHeight: 40,
  boxSizing: 'border-box',
  padding: '9px 11px',
  borderRadius: 9,
  border:
    '1px solid #D8E0D6',
  background: '#FFFFFF',
  color: '#24352B',
  fontSize: 12,
  outline: 'none',
};

const deleteButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 40,
  padding: '0 15px',
  color: '#A3332A',
  background: '#FFF5F4',
  border: '1px solid #F0C7C3',
  borderRadius: 11,
  fontSize: 12.5,
  fontWeight: 600,
};

/* ============================================================
   CATEGORY CAMPAIGN MANAGEMENT
============================================================ */

function CategoryCampaignManagement({
  categories,
  campaigns,
  loading,
  saving,
  error,
  success,
  form,
  previewUrl,
  editingId,
  fileInputRef,
  handleChange,
  handleFileChange,
  handleSubmit,
  removeImage,
  resetForm,
  onEdit,
  onDelete,
}) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            margin: '0 0 6px',
            color: '#276345',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          App Banners
        </p>
        <h2 style={{ margin: 0, color: '#123D2B', fontSize: 22 }}>
          Category Campaigns
        </h2>
        <p style={{ margin: '6px 0 0', color: '#77746C', fontSize: 13 }}>
          Manage promotional campaign banners shown for categories in the AUMVEDA mobile app.
        </p>
      </div>

      {error && (
        <div style={campaignAlertStyle.error}>
          {error}
        </div>
      )}

      {success && (
        <div style={campaignAlertStyle.success}>
          {success}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 420px) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <form onSubmit={handleSubmit} style={campaignPanelStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>
                {editingId ? 'Edit Campaign' : 'Add Campaign'}
              </h3>
              <p style={{ margin: '6px 0 0', color: '#777', fontSize: 13 }}>
                App category campaign
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={campaignSecondaryButtonStyle}
              >
                Cancel
              </button>
            )}
          </div>

          <label style={campaignLabelStyle} htmlFor="campaign-title">
            Campaign Title
          </label>
          <input
            id="campaign-title"
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Example: Immunity Care"
            style={inputStyle}
          />

          <label style={campaignLabelStyle} htmlFor="campaign-category">
            Category
          </label>
          <select
            id="campaign-category"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <label style={campaignLabelStyle}>
            Campaign Image
          </label>
          <div
            style={{
              border: '1px dashed #CFCBC2',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}
          >
            {previewUrl ? (
              <div>
                <img
                  src={previewUrl}
                  alt="Campaign preview"
                  style={{
                    width: '100%',
                    maxHeight: 190,
                    objectFit: 'cover',
                    borderRadius: 10,
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    ...campaignSecondaryButtonStyle,
                    marginTop: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <X size={15} />
                  Remove Image
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  minHeight: 120,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <UploadCloud size={26} />
                <strong>Upload campaign image</strong>
                <span style={{ color: '#777', fontSize: 12 }}>
                  JPG, PNG or WEBP - Max 10 MB
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div>
              <label style={campaignLabelStyle} htmlFor="campaign-order">
                Display Order
              </label>
              <input
                id="campaign-order"
                type="number"
                min="1"
                name="sort_order"
                value={form.sort_order}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={campaignLabelStyle}>Status</label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 40,
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Active
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...campaignSubmitButtonStyle,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Loader2 size={16} className="spin" />
                Saving...
              </span>
            ) : editingId ? (
              'Update Campaign'
            ) : (
              'Create Campaign'
            )}
          </button>
        </form>

        <div
          style={{
            ...campaignPanelStyle,
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid #ECEAE5',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18 }}>
              Existing Campaigns
            </h3>
            <p style={{ margin: '5px 0 0', color: '#777', fontSize: 13 }}>
              App category campaign banners
            </p>
          </div>

          {loading ? (
            <div style={campaignListMessageStyle}>
              <Loader2 size={24} />
              <p>Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div style={campaignListMessageStyle}>
              No category campaigns found.
            </div>
          ) : (
            <div>
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px minmax(0, 1fr) auto',
                    gap: 16,
                    alignItems: 'center',
                    padding: 16,
                    borderBottom: '1px solid #F0EEE9',
                  }}
                >
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    style={{
                      width: 140,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 10,
                      background: '#F5F4F0',
                    }}
                  />
                  <div>
                    <strong style={{ display: 'block', marginBottom: 5 }}>
                      {campaign.title}
                    </strong>
                    <div style={{ fontSize: 12, color: '#777' }}>
                      Category:{' '}
                      {campaign.categories?.name ||
                        categories.find(
                          (category) =>
                            String(category.id) ===
                            String(campaign.category_id)
                        )?.name ||
                        'Unknown'}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginTop: 7,
                        fontSize: 12,
                      }}
                    >
                      <span>Order: {campaign.sort_order}</span>
                      <span
                        style={{
                          color: campaign.is_active ? '#17663D' : '#777',
                        }}
                      >
                        {campaign.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => onEdit(campaign)}
                      style={campaignSmallButtonStyle}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(campaign)}
                      style={{
                        ...campaignSmallButtonStyle,
                        color: '#B42318',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const campaignAlertStyle = {
  error: {
    marginBottom: 16,
    padding: '12px 14px',
    borderRadius: 10,
    background: '#FFF1F1',
    color: '#B42318',
    border: '1px solid #F5C2C0',
  },
  success: {
    marginBottom: 16,
    padding: '12px 14px',
    borderRadius: 10,
    background: '#EAF7EF',
    color: '#17663D',
    border: '1px solid #C8E5D2',
  },
};

const campaignPanelStyle = {
  background: '#fff',
  border: '1px solid #E7E5DF',
  borderRadius: 16,
  padding: 22,
};

const campaignLabelStyle = {
  display: 'block',
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 600,
  color: '#3F3E39',
};

const campaignSecondaryButtonStyle = {
  border: '1px solid #DDD9D0',
  background: '#fff',
  borderRadius: 8,
  padding: '7px 10px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};

const campaignSubmitButtonStyle = {
  width: '100%',
  marginTop: 18,
  border: 'none',
  borderRadius: 10,
  padding: '12px 16px',
  background: '#1F6B52',
  color: '#fff',
  fontWeight: 700,
};

const campaignListMessageStyle = {
  padding: 40,
  textAlign: 'center',
  color: '#777',
};

const campaignSmallButtonStyle = {
  border: '1px solid #DDD9D0',
  background: '#fff',
  borderRadius: 8,
  padding: '7px 10px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};