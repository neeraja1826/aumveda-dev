import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  ImagePlus,
  Images,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';

import { createBanner, getBanners } from '../services/adminService';

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

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM);

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getBanners();
      setBanners(response?.items || []);
    } catch (err) {
      setError(err.message || 'Unable to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateImage = (file) => {
    if (!file) return false;

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed.');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Banner image must be smaller than 10 MB.');
      return false;
    }

    const image = new Image();

    image.onload = () => {
      const ratio = image.width / image.height;
      const expectedRatio = 7 / 3;

      if (Math.abs(ratio - expectedRatio) > 0.03) {
        setError(
          `Invalid banner ratio. Please use a 7:3 image. Current image is ${image.width} × ${image.height}.`
        );
        setForm((current) => ({
          ...current,
          image: null,
        }));

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl('');
        }
      }
    };

    image.src = URL.createObjectURL(file);

    return true;
  };

  const selectImage = (file) => {
    if (!file) return;

    setError('');
    setSuccess('');

    if (!validateImage(file)) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);

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

    const file = event.dataTransfer.files?.[0];

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

    setForm(INITIAL_FORM);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!form.image) {
      setError('Please select a banner image.');
      return;
    }

    if (!form.display_location) {
      setError('Please select a display location.');
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append('image', form.image);
      formData.append(
        'display_location',
        form.display_location
      );
      formData.append(
        'display_order',
        String(form.display_order)
      );
      formData.append(
        'publish_status',
        form.publish_status
      );

      if (form.starts_at) {
        formData.append('starts_at', form.starts_at);
      }

      if (form.ends_at) {
        formData.append('ends_at', form.ends_at);
      }

      await createBanner(formData);

      setSuccess('Banner uploaded successfully.');

      resetForm();

      await loadBanners();
    } catch (err) {
      setError(
        err.message || 'Unable to create banner'
      );
    } finally {
      setSaving(false);
    }
  };

  const publishedCount = banners.filter(
    (banner) => banner.publish_status === 'published'
  ).length;

  const draftCount = banners.filter(
    (banner) => banner.publish_status === 'draft'
  ).length;

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

  return (
    <div
      style={{
        minHeight: '100%',
        paddingBottom: 40,
      }}
    >
      {/* PAGE HEADER */}
      <div
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
            style={{
              margin: 0,
              fontSize: 30,
              lineHeight: 1.15,
              color: '#123D2B',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            App Banners
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: '#716F68',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Manage promotional banners displayed in the
            AUMVEDA customer app.
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            padding: '13px 16px',
            marginBottom: 18,
            borderRadius: 12,
            background: '#FFF4F2',
            border: '1px solid #F4D0CA',
            color: '#A3332A',
            fontSize: 13,
          }}
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            style={{
              border: 0,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '13px 16px',
            marginBottom: 18,
            borderRadius: 12,
            background: '#EEF8F0',
            border: '1px solid #CDE5D2',
            color: '#17663D',
            fontSize: 13,
          }}
        >
          <CheckCircle2 size={17} />
          {success}
        </div>
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
          icon={<CheckCircle2 size={19} />}
          label="Published"
          value={publishedCount}
        />

        <StatCard
          icon={<Clock3 size={19} />}
          label="Drafts"
          value={draftCount}
        />
      </div>

      {/* ADD BANNER */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E7DF',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 8px 28px rgba(18, 61, 43, 0.05)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: '20px 22px',
            borderBottom: '1px solid #EDF0EB',
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
                Upload a 7:3 promotional banner for the
                customer app.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: 22 }}>
            {/* IMAGE UPLOAD */}
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (!previewUrl) {
                  fileInputRef.current?.click();
                }
              }}
              style={{
                position: 'relative',
                minHeight: previewUrl ? 250 : 210,
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
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
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
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background:
                        'rgba(18, 61, 43, 0.88)',
                      color: '#FFFFFF',
                      backdropFilter: 'blur(8px)',
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
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {form.image?.name}
                      </div>

                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 10,
                          opacity: 0.75,
                        }}
                      >
                        {(
                          form.image?.size /
                          1024 /
                          1024
                        ).toFixed(2)}{' '}
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
                        justifyContent: 'center',
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
                      margin: '0 auto 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#EAF3E8',
                      color: '#276345',
                    }}
                  >
                    <UploadCloud size={24} />
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
                    or click to browse from your computer
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      marginTop: 13,
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: '#FFFFFF',
                      border: '1px solid #DDE6DA',
                      color: '#5F675F',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    JPG · PNG · WEBP · 7:3 ratio · Max 10 MB
                  </div>
                </div>
              )}
            </div>

            {/* FORM */}
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
                  value={form.display_location}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  {DISPLAY_LOCATIONS.map((location) => (
                    <option
                      key={location}
                      value={location}
                    >
                      {location}
                    </option>
                  ))}
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
                  value={form.display_order}
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
                    <option
                      key={status}
                      value={status}
                    >
                      {status.charAt(0).toUpperCase() +
                        status.slice(1)}
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

            {/* ACTIONS */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 22,
                paddingTop: 18,
                borderTop: '1px solid #EDF0EB',
              }}
            >
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                style={{
                  padding: '10px 17px',
                  borderRadius: 9,
                  border: '1px solid #D8DED6',
                  background: '#FFFFFF',
                  color: '#4F574F',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: saving
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  minWidth: 135,
                  padding: '10px 18px',
                  borderRadius: 9,
                  border: '1px solid #123D2B',
                  background: '#123D2B',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: saving
                    ? 'not-allowed'
                    : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow:
                    '0 5px 14px rgba(18,61,43,0.16)',
                  opacity: saving ? 0.75 : 1,
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
                    <UploadCloud size={15} />
                    Save Banner
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* EXISTING BANNERS */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E7DF',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 8px 28px rgba(18, 61, 43, 0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            padding: '20px 22px',
            borderBottom: '1px solid #EDF0EB',
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
              Existing Banners
            </h2>

            <p
              style={{
                margin: '4px 0 0',
                color: '#77746C',
                fontSize: 12,
              }}
            >
              Banners currently configured for the app.
            </p>
          </div>

          <div
            style={{
              padding: '7px 11px',
              borderRadius: 999,
              background: '#F3F7F1',
              border: '1px solid #DCE8D9',
              color: '#276345',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {banners.length}{' '}
            {banners.length === 1 ? 'Banner' : 'Banners'}
          </div>
        </div>

        <div style={{ padding: 22 }}>
          {loading ? (
            <div
              style={{
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
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
              <span style={{ fontSize: 12 }}>
                Loading banners...
              </span>
            </div>
          ) : banners.length === 0 ? (
            <div
              style={{
                minHeight: 210,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                border: '1px dashed #D7E0D4',
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
                  alignItems: 'center',
                  justifyContent: 'center',
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
                No banners yet
              </div>

              <div
                style={{
                  marginTop: 5,
                  color: '#77746C',
                  fontSize: 12,
                }}
              >
                Upload your first app banner above.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 18,
              }}
            >
              {banners.map((banner) => {
                const statusStyle = getStatusStyle(
                  banner.publish_status
                );

                return (
                  <article
                    key={banner.id}
                    style={{
                      border: '1px solid #E2E7DF',
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
                        aspectRatio: '7 / 3',
                        background: '#F2F4F1',
                        overflow: 'hidden',
                      }}
                    >
                      {banner.image_url ? (
                        <img
                          src={banner.image_url}
                          alt={
                            banner.alt_text || 'Banner'
                          }
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
                            justifyContent: 'center',
                            color: '#77746C',
                          }}
                        >
                          No image
                        </div>
                      )}

                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          padding: '5px 9px',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.92)',
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
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 10,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <h3
                            style={{
                              margin: 0,
                              color: '#123D2B',
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {banner.title ||
                              banner.metadata
                                ?.display_location ||
                              'App Banner'}
                          </h3>

                          <p
                            style={{
                              margin: '5px 0 0',
                              color: '#77746C',
                              fontSize: 11,
                            }}
                          >
                            {banner.metadata
                              ?.display_location ||
                              'AUMVEDA App'}
                          </p>
                        </div>

                        <span
                          style={{
                            flexShrink: 0,
                            padding: '5px 8px',
                            borderRadius: 999,
                            background:
                              statusStyle.background,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            fontSize: 9,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {banner.publish_status}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
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

                        <span>7:3 Banner</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

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

          @media (max-width: 700px) {
            .banner-form-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div
      style={{
        padding: '16px 17px',
        borderRadius: 14,
        background: '#FFFFFF',
        border: '1px solid #E2E7DF',
        display: 'flex',
        alignItems: 'center',
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
          alignItems: 'center',
          justifyContent: 'center',
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
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
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

function FormField({ label, required, children }) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
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

const inputStyle = {
  width: '100%',
  minHeight: 40,
  boxSizing: 'border-box',
  padding: '9px 11px',
  borderRadius: 9,
  border: '1px solid #D8E0D6',
  background: '#FFFFFF',
  color: '#24352B',
  fontSize: 12,
  outline: 'none',
};