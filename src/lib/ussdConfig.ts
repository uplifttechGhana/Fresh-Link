const DEFAULT_SHORTCODE = '*384*12345#';

export function getUssdShortcode() {
  return (import.meta.env.VITE_USSD_SHORTCODE as string | undefined)?.trim() || DEFAULT_SHORTCODE;
}
