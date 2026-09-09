"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import styles from "./page.module.css";

const photos = [
  {
    src: "/black-navalha/resultado-01.jpg",
    alt: "Trabalho de acabamento e corte realizado na Black Navalha",
    caption: "Precisão no acabamento",
    main: true,
  },
  {
    src: "/black-navalha/resultado-02.jpg",
    alt: "Degradê realizado na Black Navalha",
    caption: "Técnica em cada detalhe",
    main: false,
  },
  {
    src: "/black-navalha/hero.jpg",
    alt: "Corte e barba finalizados na Black Navalha",
    caption: "Estilo com identidade",
    main: false,
  },
];

export default function GalleryLightbox() {
  const [activePhoto, setActivePhoto] = useState<(typeof photos)[number] | null>(
    null,
  );

  useEffect(() => {
    if (!activePhoto) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePhoto(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activePhoto]);

  return (
    <>
      <div className={styles.gallery}>
        <div className={styles.galleryMain}>
          <button
            type="button"
            className={`${styles.galleryPhoto} ${styles.galleryButton}`}
            onClick={() => setActivePhoto(photos[0])}
            aria-label="Ampliar foto: Precisão no acabamento"
          >
            <Image
              src={photos[0].src}
              alt={photos[0].alt}
              fill
              sizes="(max-width: 900px) 100vw, 55vw"
            />

            <span className={styles.galleryCaption}>{photos[0].caption}</span>
            <span className={styles.galleryHint}>Clique para ampliar</span>
          </button>
        </div>

        <div className={styles.gallerySecondary}>
          {photos.slice(1).map((photo) => (
            <button
              key={photo.src}
              type="button"
              className={`${styles.gallerySmallPhoto} ${styles.galleryButton}`}
              onClick={() => setActivePhoto(photo)}
              aria-label={`Ampliar foto: ${photo.caption}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 620px) 50vw, (max-width: 900px) 100vw, 45vw"
              />

              <span className={styles.galleryCaption}>{photo.caption}</span>
              <span className={styles.galleryHint}>Clique para ampliar</span>
            </button>
          ))}
        </div>
      </div>

      {activePhoto && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada: ${activePhoto.caption}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActivePhoto(null);
            }
          }}
        >
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setActivePhoto(null)}
            aria-label="Fechar foto ampliada"
          >
            <X size={23} aria-hidden="true" />
          </button>

          <div className={styles.lightboxContent}>
            <div className={styles.lightboxImage}>
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt}
                fill
                sizes="95vw"
                priority
              />
            </div>

            <p>{activePhoto.caption}</p>
          </div>
        </div>
      )}
    </>
  );
}



