import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import GalleryLightbox from "./gallery-lightbox";
import styles from "./page.module.css";

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number | string;
  duration_minutes: number;
  subscriber_service: boolean;
};

type BusinessSettings = {
  name: string;
  whatsapp: string | null;
  address: string | null;
  instagram: string | null;
};

function formatCurrency(value: number | string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getWhatsAppHref(value: string | null) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const internationalNumber = digits.startsWith("55")
    ? digits
    : `55${digits}`;

  return `https://wa.me/${internationalNumber}`;
}

function getInstagramHref(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const handle = trimmed
    .replace(/^@/, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/\/+$/, "");

  return handle
    ? `https://www.instagram.com/${handle}`
    : null;
}

function getCategoryAnchor(category: string) {
  return `categoria-${category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}
export default async function Home() {
  const supabase = await createClient();

  const [servicesResult, settingsResult] = await Promise.all([
    supabase
      .from("services")
      .select(`
        id,
        name,
        description,
        category,
        price,
        duration_minutes,
        subscriber_service
      `)
      .eq("active", true)
      .order("category")
      .order("name"),
    supabase
      .from("business_settings")
      .select(`
        name,
        whatsapp,
        address,
        instagram
      `)
      .order("created_at", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle(),
  ]);

  const services = (servicesResult.data ?? []) as Service[];
  const settings = settingsResult.data as BusinessSettings | null;

  const subscriptionServices = services.filter(
    (service) => service.subscriber_service,
  );

  const regularServices = services.filter(
    (service) => !service.subscriber_service,
  );

  const serviceCategories = Array.from(
    new Set(regularServices.map((service) => service.category)),
  );

  const businessName = settings?.name?.trim() || "Black Navalha";
  const whatsappHref = getWhatsAppHref(settings?.whatsapp ?? null);
  const instagramHref = getInstagramHref(settings?.instagram ?? null);
  const address = settings?.address?.trim() || "";
  const mapsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;
  const mapsEmbedHref = address
    ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
    : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Black Navalha - início">
            <Image
              src="/black-navalha/logo.png"
              alt=""
              width={1591}
              height={1180}
              className={styles.brandLogo}
              priority
            />
            <span className={styles.brandName}>Black Navalha</span>
          </Link>

          <nav className={styles.nav} aria-label="Navegação principal">
            <a href="#trabalhos">Trabalhos</a>
            <a href="#servicos">Serviços</a>
            <a href="#contato">Contato</a>

            <Link href="/agendar" className={styles.navCta}>
              Agendar horário
            </Link>
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroImage}>
          <Image
            src="/black-navalha/hero.jpg"
            alt="Resultado de corte e barba na Black Navalha"
            fill
            priority
            sizes="100vw"
          />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{businessName}</p>

            <h1>
              Seu estilo.
              <span>Sua identidade.</span>
            </h1>

            <p className={styles.heroText}>
              Técnica, atenção e precisão em cada detalhe. Escolha seu
              serviço, seu profissional e agende seu horário online.
            </p>

            <div className={styles.heroActions}>
              <Link href="/agendar" className={styles.primaryButton}>
                <CalendarDays size={17} aria-hidden="true" />
                Agendar horário
              </Link>

              <a href="#servicos" className={styles.secondaryButton}>
                Ver serviços
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.heroDetail}>
          <strong>O diferencial está nos detalhes</strong>
          <span>Corte, barba e cuidado do seu jeito.</span>
        </div>
      </section>

      <section className={styles.section} id="trabalhos">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>Black Navalha</p>

          <h2 className={styles.sectionTitle}>
            Um bom corte valoriza você.
          </h2>

          <p className={styles.sectionLead}>
            Cada atendimento é pensado para alinhar técnica, estilo e
            acabamento. Resultado que respeita suas características e
            acompanha sua rotina.
          </p>
        </div>

        <GalleryLightbox />
      </section>

      <section className={styles.servicesSection} id="servicos">
        <div className={styles.servicesInner}>
          <div className={styles.sectionIntro}>
            <p className={styles.sectionLabel}>Serviços</p>

            <h2 className={styles.sectionTitle}>
              Encontre o cuidado ideal.
            </h2>

            <p className={styles.sectionLead}>
              Conheça nossas assinaturas e os serviços disponíveis na Black
              Navalha.
            </p>
          </div>

          {servicesResult.error && (
            <div className={styles.error}>
              Não foi possível carregar os serviços no momento.
            </div>
          )}

          {!servicesResult.error && services.length > 0 && (
            <div className={styles.serviceGroups}>
              {subscriptionServices.length > 0 && (
                <article className={`${styles.serviceGroup} ${styles.subscriptionGroup}`}>
                  <div className={styles.serviceGroupHeader}>
                    <span className={styles.serviceGroupEyebrow}>Black Navalha</span>
                    <h3>Assinatura</h3>
                    <p>Planos mensais para manter seu estilo sempre em dia.</p>
                  </div>

                  <ul className={styles.serviceList}>
                    {subscriptionServices.map((service) => (
                      <li key={service.id}>{service.name}</li>
                    ))}
                  </ul>

                  <Link href="/assinaturas" className={styles.planButton}>
                    Conhecer planos
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </article>
              )}

              {serviceCategories.map((category) => (
                <Link
                  href={`/agendar#${getCategoryAnchor(category)}`}
                  className={`${styles.serviceGroup} ${styles.serviceGroupLink}`}
                  key={category}
                  aria-label={`Agendar serviço de ${category}`}
                >
                  <div className={styles.serviceGroupHeader}>
                    <span className={styles.serviceGroupEyebrow}>Black Navalha</span>
                    <h3>{category}</h3>
                    <p>Escolha o serviço que combina com o seu estilo.</p>
                  </div>

                  <ul className={styles.serviceList}>
                    {regularServices
                      .filter((service) => service.category === category)
                      .map((service) => (
                        <li key={service.id}>{service.name}</li>
                      ))}
                  </ul>

                  <span className={styles.groupAction}>
                    Agendar
                    <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          )}

          {!servicesResult.error && services.length === 0 && (
            <div className={styles.error}>
              Nenhum serviço disponível no momento.
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.experience}>
          <div className={styles.facade}>
            <Image
              src="/black-navalha/fachada.jpg"
              alt="Fachada da Barbearia Black Navalha"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
            />
          </div>

          <div className={styles.experienceCopy}>
            <p className={styles.sectionLabel}>Como chegar</p>

            <h2 className={styles.sectionTitle}>
              Encontre a Black Navalha.
            </h2>

            <p className={styles.sectionLead}>
              Veja nossa localização, trace sua rota e venha cuidar do visual
              com a gente.
            </p>

            {mapsEmbedHref && (
              <div className={styles.mapFrame}>
                <iframe
                  src={mapsEmbedHref}
                  title={`Localização da ${businessName}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

            <div className={styles.locationDetails}>
              {address && (
                <div className={styles.locationItem}>
                  <span>Endereço</span>
                  <strong>{address}</strong>
                </div>
              )}

              {settings?.whatsapp && whatsappHref && (
                <div className={styles.locationItem}>
                  <span>WhatsApp</span>
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    {settings.whatsapp}
                  </a>
                </div>
              )}

              {settings?.instagram && instagramHref && (
                <div className={styles.locationItem}>
                  <span>Instagram</span>
                  <a href={instagramHref} target="_blank" rel="noreferrer">
                    {settings.instagram}
                  </a>
                </div>
              )}
            </div>

            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className={styles.primaryButton}
              >
                Como chegar
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </section>

      <section className={styles.reviewsSection} aria-labelledby="avaliacoes-title">
        <div className={styles.reviewsInner}>
          <div className={styles.reviewsHeader}>
            <div className={styles.reviewsIntro}>
              <p className={styles.sectionLabel}>Avaliações</p>

              <h2 id="avaliacoes-title" className={styles.reviewsTitle}>
                Quem conhece, recomenda.
              </h2>

              <p className={styles.reviewsLead}>
                A experiência de quem já passou pela Black Navalha.
              </p>
            </div>

            <div className={styles.googleRating}>
              <span className={styles.googleRatingLabel}>Google</span>

              <div className={styles.googleRatingScore}>
                <strong>5,0</strong>

                <div>
                  <div className={styles.ratingStars} aria-label="5 de 5 estrelas">
                    ★★★★★
                  </div>
                  <span>90 avaliações</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.reviewsGrid}>
            <article className={styles.reviewCard}>
              <div className={styles.reviewCardTop}>
                <div>
                  <strong>Wellington Salazario</strong>
                  <span>Google</span>
                </div>
                <span className={styles.reviewQuote} aria-hidden="true">“</span>
              </div>

              <div className={styles.reviewStars} aria-label="5 de 5 estrelas">
                ★★★★★
              </div>

              <p>
                Ótimo atendimento, corte tri bom! Profissional excelente! O
                melhor da região! Voltarei outras vezes.
              </p>
            </article>

            <article className={styles.reviewCard}>
              <div className={styles.reviewCardTop}>
                <div>
                  <strong>Paulo Otavio</strong>
                  <span>Google</span>
                </div>
                <span className={styles.reviewQuote} aria-hidden="true">“</span>
              </div>

              <div className={styles.reviewStars} aria-label="5 de 5 estrelas">
                ★★★★★
              </div>

              <p>
                Curti muito a experiência e podem ter certeza que ganharam mais
                um cliente.
              </p>
            </article>

            <article className={styles.reviewCard}>
              <div className={styles.reviewCardTop}>
                <div>
                  <strong>Carlos Mateus</strong>
                  <span>Google</span>
                </div>
                <span className={styles.reviewQuote} aria-hidden="true">“</span>
              </div>

              <div className={styles.reviewStars} aria-label="5 de 5 estrelas">
                ★★★★★
              </div>

              <p>
                Parabéns ao atendimento e pelo excelente trabalho vcs são fera.
              </p>
            </article>
          </div>

          <a
            href="https://www.google.com/maps/place/Barbearia+Black+Navalha+%7C+Atuba+Pinhais/@-25.4044123,-49.1893822,17z/data=!3m1!4b1!4m6!3m5!1s0x94dcef2db019dca3:0xfc0a00cd7a5cf5cf!8m2!3d-25.4044123!4d-49.1893822!16s%2Fg%2F11pb3ck25x?entry=ttu"
            target="_blank"
            rel="noreferrer"
            className={styles.reviewsLink}
          >
            Ver todas as avaliações no Google
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
      </section>
      <section className={styles.contactSection} id="contato">
        <div className={styles.contactInner}>
          <div>
            <p className={styles.sectionLabel}>Seu próximo horário</p>

            <h2 className={styles.sectionTitle}>
              Pronto para cuidar do visual?
            </h2>

            <p className={styles.sectionLead}>
              Faça seu agendamento online em poucos passos e escolha a
              melhor opção disponível para você.
            </p>

            <div className={styles.heroActions}>
              <Link href="/agendar" className={styles.primaryButton}>
                Agendar horário
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className={styles.contactInfo}>
            {settings?.address && (
              <div className={styles.contactItem}>
                <small>Endereço</small>
                <strong>{settings.address}</strong>
              </div>
            )}

            {settings?.whatsapp && (
              <div className={styles.contactItem}>
                <small>WhatsApp</small>

                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {settings.whatsapp}
                  </a>
                ) : (
                  <strong>{settings.whatsapp}</strong>
                )}
              </div>
            )}

            {settings?.instagram && (
              <div className={styles.contactItem}>
                <small>Instagram</small>

                {instagramHref ? (
                  <a
                    href={instagramHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {settings.instagram}
                  </a>
                ) : (
                  <strong>{settings.instagram}</strong>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>{businessName} · Barbearia</span>
        <Link href="/agendar">Agendar horário</Link>
      </footer>
    </main>
  );
}
















