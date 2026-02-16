import './style.css';
import { appTemplate } from './ui/templates';
import { FindItApp } from './ui/app';
import { registerPWA } from './pwa/register';
import type { Item } from './core/types';

const bootstrap = async () => {
  const root = document.querySelector<HTMLDivElement>('#app');
  if (!root) throw new Error('App root not found');

  root.innerHTML = appTemplate;

  const response = await fetch('/content/items.json');
  const items = (await response.json()) as Item[];

  const app = new FindItApp(root, items);
  app.init();
  registerPWA();
};

bootstrap().catch((error) => {
  console.error('Failed to start Find It!', error);
});
