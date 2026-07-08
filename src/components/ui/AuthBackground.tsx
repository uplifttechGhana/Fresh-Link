import { ReactNode } from 'react';
import harvestPhoto from '../../assets/photos/harvest-women.jpg';
import monstera from '../../assets/leaves/monstera.png';
import fern from '../../assets/leaves/fern.png';
import singleLeaf from '../../assets/leaves/single-leaf.png';

/**
 * Edge-to-edge auth photo with compact top/bottom gradients and transparent
 * leaf accents in those bands (mobile, webview, and desktop).
 */
export function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <div className="auth-background">
      <div className="auth-background__layer" aria-hidden="true">
        <img
          src={harvestPhoto}
          alt=""
          className="auth-background__photo"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="auth-background__gradient-top" />
        <div className="auth-background__gradient-bottom" />
        <img
          src={fern}
          alt=""
          className="auth-background__leaf auth-background__leaf--fern-top"
          draggable={false}
        />
        <img
          src={monstera}
          alt=""
          className="auth-background__leaf auth-background__leaf--monstera-top"
          draggable={false}
        />
        <img
          src={singleLeaf}
          alt=""
          className="auth-background__leaf auth-background__leaf--single-bottom"
          draggable={false}
        />
        <img
          src={fern}
          alt=""
          className="auth-background__leaf auth-background__leaf--fern-bottom"
          draggable={false}
        />
      </div>
      <div className="auth-background__content">{children}</div>
    </div>
  );
}
