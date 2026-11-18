import '../styles/notification-reference-details.css';

const sensitiveFieldPattern =
  /password|secret|token|authorization|card_number|cvv|cvc|raw_response|gateway_response/i;

function formatLabel(value) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatValue(value, fieldName) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (
    typeof value === 'string' &&
    /(_at|_date)$/i.test(fieldName) &&
    value
  ) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  return String(value);
}

function RecordFields({ record, depth = 0 }) {
  const entries = Object.entries(record || {}).filter(
    ([key, value]) =>
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !sensitiveFieldPattern.test(key)
  );

  if (!entries.length) return null;

  return (
    <dl className={depth ? 'notification-reference-nested' : undefined}>
      {entries.map(([key, value]) => {
        const isObject = value && typeof value === 'object';
        const isRelatedRecords = key === 'related' && !Array.isArray(value);

        return (
          <div
            className={isRelatedRecords ? 'notification-reference-related' : ''}
            key={key}
          >
            <dt>{formatLabel(key)}</dt>
            <dd>
              {Array.isArray(value) ? (
                <ul>
                  {value.map((item, index) => (
                    <li key={`${key}-${index}`}>
                      {item && typeof item === 'object' ? (
                        <RecordFields record={item} depth={depth + 1} />
                      ) : (
                        formatValue(item, key)
                      )}
                    </li>
                  ))}
                </ul>
              ) : isObject ? (
                <RecordFields record={value} depth={depth + 1} />
              ) : (
                formatValue(value, key)
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export default function NotificationReferenceDetails({
  record,
  referenceType,
}) {
  if (!record) return null;

  return (
    <section className="notification-reference-details">
      <h2>{formatLabel(referenceType || 'record')} details</h2>
      <RecordFields record={record} />
    </section>
  );
}
