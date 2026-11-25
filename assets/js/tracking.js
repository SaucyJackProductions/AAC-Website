/* Above All Media: Google Tag Manager loader + tracking events.
 *
 * ONE PLACE TO SET THE CONTAINER ID: replace GTM-XXXXXXX below with the ID from
 * tagmanager.google.com (Admin > Container settings). Each page also has a
 * <noscript> GTM iframe right after <body> for visitors with JavaScript off;
 * update those with the same ID:
 *   grep -rl GTM-XXXXXXX --include=*.html . | xargs sed -i 's/GTM-XXXXXXX/GTM-YOURID/g'
 * (that one command also updates this file).
 *
 * While the ID is still the placeholder, GTM is not loaded at all, but the
 * dataLayer events below are still pushed, so nothing breaks.
 *
 * dataLayer events (set up GTM "Custom Event" triggers with these exact names):
 *   generate_lead  a contact or card-exchange form was sent successfully
 *                  params: lead_form ('site_inquiry' | 'card_exchange' | 'site_inquiry_fallback'),
 *                          service_type, call_booked (true/false)
 *   phone_click    a tel: or sms: link was tapped    params: contact_method ('call' | 'text'), link_location
 *   email_click    a mailto: link was tapped         params: contact_method ('email'), link_location
 * No names, emails or phone numbers are ever put in the dataLayer.
 */
(function (w, d) {
  var GTM_ID = 'GTM-XXXXXXX';

  w.dataLayer = w.dataLayer || [];

  if (/^GTM-[A-Z0-9]+$/.test(GTM_ID) && GTM_ID !== 'GTM-XXX' + 'XXXX') {
    w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = d.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    var first = d.getElementsByTagName('script')[0];
    if (first && first.parentNode) first.parentNode.insertBefore(s, first); else d.head.appendChild(s);
  }

  /* Phone / text / email clicks, anywhere on the page (delegated, so links added later count too) */
  function where(a) {
    var sec = a.closest && a.closest('section[id], header, footer, nav, dialog[id], aside[id]');
    if (!sec) return 'page';
    return sec.id || sec.tagName.toLowerCase();
  }
  d.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = (a.getAttribute('href') || '').trim().toLowerCase();
    if (href.indexOf('tel:') === 0) {
      w.dataLayer.push({ event: 'phone_click', contact_method: 'call', link_location: where(a) });
    } else if (href.indexOf('sms:') === 0 && !/[?&]body=/.test(href)) {          /* not the "share this card" text */
      w.dataLayer.push({ event: 'phone_click', contact_method: 'text', link_location: where(a) });
    } else if (href.indexOf('mailto:') === 0 && href.indexOf('mailto:?') !== 0) { /* not the "share this card" email */
      w.dataLayer.push({ event: 'email_click', contact_method: 'email', link_location: where(a) });
    }
  }, true);
})(window, document);
