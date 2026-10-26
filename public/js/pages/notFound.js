import { html } from '../core/html.js';
import { t } from '../core/i18n.js';
import { emptyState } from '../molecules/emptyState.js';
import { link } from '../core/router.js';

export default {
  titleKey: 'notFound.title',
  crumbs: () => [{ label: t('notFound.title') }],
  view() {
    return html`<div class="glass-card">${emptyState({ iconName: 'search', title: t('notFound.title'), text: t('notFound.text') })}
      <div class="-mt-6 pb-6 text-center"><a class="btn btn-primary btn-sm" href="${link('/dashboard')}">${t('notFound.action')}</a></div></div>`;
  }
};
