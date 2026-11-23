/**
 * Contact details shown on public pages. They come from the business_phone
 * setting (Admin → Users & settings) so no phone number is hard-coded.
 */
export interface Contact {
  /** As typed in settings, e.g. "0300-1234567". Empty when not set. */
  phone: string;
  /** tel: href, or null when no phone is configured. */
  telHref: string | null;
  /** wa.me base URL (no message), or null when no phone is configured. */
  whatsappHref: string | null;
}

/** Normalise a Pakistani number to international digits: 03001234567 → 923001234567. */
export function toInternationalPk(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  if (digits.startsWith('92')) return digits;
  if (digits.startsWith('0')) return `92${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('3')) return `92${digits}`;
  return digits;
}

export function buildContact(phone: string): Contact {
  const trimmed = phone.trim();
  const intl = trimmed ? toInternationalPk(trimmed) : null;
  return {
    phone: trimmed,
    telHref: intl ? `tel:+${intl}` : null,
    whatsappHref: intl ? `https://wa.me/${intl}` : null,
  };
}

export function whatsappWithText(contact: Contact, text: string): string | null {
  return contact.whatsappHref ? `${contact.whatsappHref}?text=${encodeURIComponent(text)}` : null;
}
