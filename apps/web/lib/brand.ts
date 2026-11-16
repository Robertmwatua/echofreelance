/** Public product name — use everywhere users see the school. */
export const SITE_NAME = 'EchoFreelance Tech School'
export const SITE_NAME_SHORT = 'EchoFreelance'

/** Public contacts. Existing privacy-page email is the source of the default. */
export const SCHOOL_CONTACT_EMAIL = process.env.NEXT_PUBLIC_SCHOOL_CONTACT_EMAIL?.trim() || 'ecofreelancetechnologyplus@gmail.com'
export const SCHOOL_LOCATION = 'Malindi, Kenya'
// TODO(content): Set NEXT_PUBLIC_SCHOOL_WHATSAPP_NUMBER to the school's approved
// public international number. Never use the paid-student group invite here.
const whatsappDigits = (process.env.NEXT_PUBLIC_SCHOOL_WHATSAPP_NUMBER || '').replace(/\D/g,'')
export const SCHOOL_WHATSAPP_URL = /^\d{9,15}$/.test(whatsappDigits) ? `https://wa.me/${whatsappDigits}` : null

/** Exact Street View location supplied by the school; no inferred street address. */
export const SCHOOL_MAP_URL = 'https://www.google.com/maps/@-3.2196845,40.1096298,15a,75y,330.71h,95.28t/data=!3m7!1e1!3m5!1sUDRTrz86Z0-pO6O6QyOzxg!2e0!6shttps:%2F%2Fstreetviewpixels-pa.clients6.google.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-5.278940965234199%26panoid%3DUDRTrz86Z0-pO6O6QyOzxg%26yaw%3D330.7114609849881!7i16384!8i8192?entry=ttu'
export const SCHOOL_MAP_EMBED_URL = 'https://www.google.com/maps?q=-3.2196845,40.1096298&z=17&output=embed'
