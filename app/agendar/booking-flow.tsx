"use client";

import { useMemo, useState, useEffect} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Scissors,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";


type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number | string;
  duration_minutes: number;
  subscriber_service: boolean;
};

type Barber = {
  id: string;
  name: string;
  photo_url: string | null;
};

type BarberService = {
  barber_id: string;
  service_id: string;
};

type WorkingHour = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type BusyPeriod = {
  start_at: string;
  end_at: string;
};

type CalendarCell = {
  value: string;
  day: number;
  disabled: boolean;
} | null;


function getCategoryAnchor(category: string) {
  return `categoria-${category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}
export default function BookingFlow({
  services,
  barbers,
  links,
}: {
  services: Service[];
  barbers: Barber[];
  links: BarberService[];
}) {
  const supabase = createClient();

  useEffect(() => {
    const hash = window.location.hash;

    if (!hash.startsWith("#categoria-")) {
      return;
    }

    const targetId = decodeURIComponent(hash.slice(1));

    const scrollToCategory = () => {
      const target = document.getElementById(targetId);

      if (!target) {
        return;
      }

      target.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    };

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToCategory);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);


  const [step, setStep] = useState(1);

  // Agora temos vários serviços
  const [selectedServices, setSelectedServices] =
    useState<Service[]>([]);

  const [selectedBarber, setSelectedBarber] =
    useState<Barber | null>(null);

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedTime, setSelectedTime] =
    useState("");

  const [workingHours, setWorkingHours] =
    useState<WorkingHour[]>([]);

  const [availableTimes, setAvailableTimes] =
    useState<string[]>([]);

  const [loadingHours, setLoadingHours] =
    useState(false);

  const [loadingTimes, setLoadingTimes] =
    useState(false);

  const [scheduleMessage, setScheduleMessage] =
    useState("");

  const [customerName, setCustomerName] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [confirming, setConfirming] =
    useState(false);

  const [
    confirmationError,
    setConfirmationError,
  ] = useState("");

  const [appointmentId, setAppointmentId] =
    useState("");


  // =====================================================
  // TOTAIS
  // =====================================================

  const totalDuration =
    selectedServices.reduce(
      (total, service) =>
        total +
        service.duration_minutes,
      0
    );


  const totalPrice =
    selectedServices.reduce(
      (total, service) =>
        total +
        Number(service.price),
      0
    );


  // =====================================================
  // MESES
  // =====================================================

  const baseMonth = useMemo(() => {
    const today = new Date();

    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  }, []);


  const nextMonthLimit =
    useMemo(
      () =>
        new Date(
          baseMonth.getFullYear(),
          baseMonth.getMonth() + 1,
          1
        ),
      [baseMonth]
    );


  const [currentMonth, setCurrentMonth] =
    useState(baseMonth);


  // =====================================================
  // CATEGORIAS
  // =====================================================

  const categories =
    useMemo(
      () =>
        Array.from(
          new Set(
            services.map(
              (service) =>
                service.category
            )
          )
        ),
      [services]
    );


  // =====================================================
  // BARBEIROS QUE FAZEM TODOS OS SERVIÇOS
  // =====================================================

  const availableBarbers =
    barbers.filter(
      (barber) =>
        selectedServices.every(
          (service) =>
            links.some(
              (link) =>
                link.barber_id ===
                  barber.id &&
                link.service_id ===
                  service.id
            )
        )
    );


  // =====================================================
  // JORNADA
  // =====================================================

  const activeWeekdays =
    useMemo(
      () =>
        new Set(
          workingHours.map(
            (item) =>
              item.day_of_week
          )
        ),
      [workingHours]
    );


  // =====================================================
  // CALENDÁRIO
  // =====================================================

  const calendarDays =
    useMemo(
      () =>
        buildCalendarMonth(
          currentMonth,
          activeWeekdays
        ),
      [
        currentMonth,
        activeWeekdays,
      ]
    );


  const monthLabel =
    capitalize(
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          month: "long",
          year: "numeric",
        }
      ).format(currentMonth)
    );


  const isAtFirstMonth =
    currentMonth.getTime() ===
    baseMonth.getTime();


  const isAtLastMonth =
    currentMonth.getTime() ===
    nextMonthLimit.getTime();


  // =====================================================
  // SERVIÇOS
  // =====================================================

  function toggleService(
    service: Service
  ) {
    setSelectedServices(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.id ===
              service.id
          );

        if (exists) {
          return current.filter(
            (item) =>
              item.id !==
              service.id
          );
        }

        return [
          ...current,
          service,
        ];
      }
    );

    // Se alterar serviço, escolhas posteriores deixam de valer
    setSelectedBarber(null);
    setSelectedDate("");
    setSelectedTime("");
  }


  function continueToBarber() {
    if (
      selectedServices.length ===
      0
    ) {
      return;
    }

    setStep(2);

    goTop();
  }


  // =====================================================
  // BARBEIRO
  // =====================================================

  async function chooseBarber(
    barber: Barber
  ) {
    setSelectedBarber(
      barber
    );

    setSelectedDate("");
    setSelectedTime("");
    setAvailableTimes([]);
    setWorkingHours([]);

    setCurrentMonth(
      baseMonth
    );

    setLoadingHours(true);

    setStep(3);

    goTop();


    const {
      data,
      error,
    } = await supabase
      .from("working_hours")
      .select(
        "day_of_week, start_time, end_time"
      )
      .eq(
        "barber_id",
        barber.id
      )
      .eq(
        "active",
        true
      );


    if (!error) {
      setWorkingHours(
        data ?? []
      );
    }


    setLoadingHours(false);
  }


  // =====================================================
  // MÊS
  // =====================================================

  function previousMonth() {
    if (isAtFirstMonth) {
      return;
    }

    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );
  }


  function nextMonth() {
    if (isAtLastMonth) {
      return;
    }

    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );
  }


  // =====================================================
  // DATA
  // =====================================================

  async function chooseDate(
    date: string
  ) {
    if (
      !selectedBarber ||
      selectedServices.length ===
        0
    ) {
      return;
    }


    const dayOfWeek =
      getDayOfWeek(date);


    const workingHour =
      workingHours.find(
        (item) =>
          item.day_of_week ===
          dayOfWeek
      );


    if (!workingHour) {
      return;
    }


    setSelectedDate(date);

    setSelectedTime("");

    setAvailableTimes([]);

    setScheduleMessage("");

    setLoadingTimes(true);

    setStep(4);

    goTop();


    const {
      data: busyPeriods,
      error: busyError,
    } = await supabase.rpc(
      "get_busy_periods",
      {
        p_barber_id:
          selectedBarber.id,

        p_date:
          date,
      }
    );


    if (busyError) {
      setScheduleMessage(
        "Não foi possível consultar os horários."
      );

      setLoadingTimes(false);

      return;
    }


    const generated =
      generateAvailableTimes(
        date,
        workingHour,
        totalDuration,
        busyPeriods ?? []
      );


    setAvailableTimes(
      generated
    );


    if (
      generated.length === 0
    ) {
      setScheduleMessage(
        "Não há horários disponíveis nesta data."
      );
    }


    setLoadingTimes(false);
  }


  function chooseTime(
    time: string
  ) {
    setSelectedTime(
      time
    );

    setConfirmationError("");

    setStep(5);

    goTop();
  }


  // =====================================================
  // TELEFONE
  // =====================================================

  function handlePhoneChange(
    value: string
  ) {
    let numbers =
      value.replace(
        /\D/g,
        ""
      );

    numbers =
      numbers.slice(
        0,
        11
      );


    if (
      numbers.length <= 2
    ) {
      setCustomerPhone(
        numbers
          ? `(${numbers}`
          : ""
      );

      return;
    }


    if (
      numbers.length <= 6
    ) {
      setCustomerPhone(
        `(${numbers.slice(
          0,
          2
        )}) ${numbers.slice(
          2
        )}`
      );

      return;
    }


    if (
      numbers.length <= 10
    ) {
      setCustomerPhone(
        `(${numbers.slice(
          0,
          2
        )}) ${numbers.slice(
          2,
          6
        )}-${numbers.slice(
          6
        )}`
      );

      return;
    }


    setCustomerPhone(
      `(${numbers.slice(
        0,
        2
      )}) ${numbers.slice(
        2,
        7
      )}-${numbers.slice(
        7
      )}`
    );
  }


  // =====================================================
  // CONFIRMAR
  // =====================================================

  async function confirmAppointment() {
    if (
      !selectedBarber ||
      !selectedDate ||
      !selectedTime ||
      selectedServices.length ===
        0
    ) {
      setConfirmationError(
        "As informações do agendamento estão incompletas."
      );

      return;
    }


    if (
      customerName
        .trim()
        .length < 2
    ) {
      setConfirmationError(
        "Informe seu nome."
      );

      return;
    }


    const phoneDigits =
      customerPhone.replace(
        /\D/g,
        ""
      );


    if (
      phoneDigits.length < 10
    ) {
      setConfirmationError(
        "Informe um WhatsApp válido."
      );

      return;
    }


    setConfirmationError("");

    setConfirming(true);


    const startAt =
      createAppointmentDate(
        selectedDate,
        selectedTime
      );


    const {
      data,
      error,
    } = await supabase.rpc(
      "create_public_multi_appointment",
      {
        p_customer_name:
          customerName.trim(),

        p_customer_phone:
          customerPhone.trim(),

        p_barber_id:
          selectedBarber.id,

        p_service_ids:
          selectedServices.map(
            (service) =>
              service.id
          ),

        p_start_at:
          startAt.toISOString(),
      }
    );


    if (error) {
      console.error(error);

      const message =
        error.message ?? "";


      if (
        message.includes(
          "acabou de ser reservado"
        )
      ) {
        setConfirmationError(
          "Este horário acabou de ser reservado. Volte e escolha outro."
        );
      } else if (
        message.includes(
          "Horário indisponível"
        )
      ) {
        setConfirmationError(
          "Este horário não está mais disponível."
        );
      } else {
        setConfirmationError(
          "Não foi possível confirmar o agendamento. Tente novamente."
        );
      }


      setConfirming(false);

      return;
    }


    setAppointmentId(
      String(data)
    );

    setConfirming(false);

    setStep(6);

    goTop();
  }


  // =====================================================
  // VOLTAR
  // =====================================================

  function back() {
    if (step === 2) {
      setSelectedBarber(null);
      setStep(1);
    }

    if (step === 3) {
      setSelectedBarber(null);
      setStep(2);
    }

    if (step === 4) {
      setSelectedDate("");
      setSelectedTime("");
      setStep(3);
    }

    if (step === 5) {
      setSelectedTime("");
      setStep(4);
    }

    goTop();
  }


  function goTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  // =====================================================
  // JSX
  // =====================================================

  return (
    <main className="booking-page">

      <div className="booking-top">

        <a
          href="/"
          className="booking-brand"
        >
          BLACK{" "}
          <span>
            NAVALHA
          </span>
        </a>

        <div className="booking-address">
          PINHAIS • PARANÁ
        </div>

      </div>


      {step <= 5 && (
        <div className="booking-progress">

          <ProgressStep
            number={1}
            label="Serviços"
            active={step === 1}
            completed={step > 1}
          />

          <ProgressStep
            number={2}
            label="Profissional"
            active={step === 2}
            completed={step > 2}
          />

          <ProgressStep
            number={3}
            label="Data"
            active={step === 3}
            completed={step > 3}
          />

          <ProgressStep
            number={4}
            label="Horário"
            active={step === 4}
            completed={step > 4}
          />

          <ProgressStep
            number={5}
            label="Confirmar"
            active={step === 5}
            completed={false}
          />

        </div>
      )}


      <div className="booking-container">


        {step > 1 &&
          step <= 5 && (

          <button
            className="booking-back"
            onClick={back}
          >
            <ArrowLeft
              size={15}
            />

            VOLTAR
          </button>

        )}


        {/* PASSO 1 */}

        {step === 1 && (
          <>
            <BookingHeading
              step="PASSO 1 DE 5"
              title="Escolha seus serviços"
              description="Você pode selecionar um ou vários serviços."
            />


            {categories.map(
              (category) => (

                <section
                  className="booking-category"
                  id={getCategoryAnchor(category)}
                  key={category}
                >

                  <div className="booking-category-title">

                    <Scissors
                      size={17}
                    />

                    <h2>
                      {category}
                    </h2>

                  </div>


                  <div className="booking-services">


                    {services
                      .filter(
                        (service) =>
                          service.category ===
                          category
                      )
                      .map(
                        (service) => {

                          const selected =
                            selectedServices.some(
                              (item) =>
                                item.id ===
                                service.id
                            );


                          return (

                            <button
                              type="button"
                              key={
                                service.id
                              }
                              className={
                                selected
                                  ? "booking-service selected-service"
                                  : "booking-service"
                              }
                              onClick={() =>
                                toggleService(
                                  service
                                )
                              }
                            >

                              <span className="multi-service-check">

                                {
                                  selected &&
                                  (
                                    <Check
                                      size={14}
                                    />
                                  )
                                }

                              </span>


                              <div className="booking-service-copy">

                                <strong>
                                  {
                                    service.name
                                  }
                                </strong>


                                {service.description && (

                                  <p>
                                    {
                                      service.description
                                    }
                                  </p>

                                )}


                                <span>

                                  <Clock3
                                    size={12}
                                  />

                                  {
                                    service.duration_minutes
                                  }{" "}
                                  min

                                </span>

                              </div>


                              <div className="booking-price">

                                {
                                  service.subscriber_service
                                    ? "PLANO"
                                    : formatPrice(
                                        service.price
                                      )
                                }

                              </div>

                            </button>

                          );

                        }
                      )}

                  </div>

                </section>

              )
            )}


            <div className="booking-selection-footer">

              <div>

                <span>
                  {
                    selectedServices.length
                  }{" "}
                  {selectedServices.length ===
                  1
                    ? "serviço"
                    : "serviços"}
                </span>

                <strong>
                  {totalDuration} min
                </strong>

                <strong className="selection-total-price">
                  {formatPrice(
                    totalPrice
                  )}
                </strong>

              </div>


              <button
                type="button"
                onClick={
                  continueToBarber
                }
                disabled={
                  selectedServices.length ===
                  0
                }
              >
                CONTINUAR
              </button>

            </div>

          </>
        )}


        {/* PASSO 2 */}

        {step === 2 && (
          <>
            <BookingHeading
              step="PASSO 2 DE 5"
              title="Escolha o profissional"
              description="Profissionais que realizam todos os serviços selecionados."
            />


            <SelectedServicesSmall
              services={
                selectedServices
              }
            />


            <div className="booking-barbers">

              {availableBarbers.map(
                (barber) => (

                  <button
                    type="button"
                    key={barber.id}
                    className="booking-barber"
                    onClick={() =>
                      chooseBarber(
                        barber
                      )
                    }
                  >

                    <div className="booking-barber-avatar">

                      {
                        barber.photo_url
                          ? (
                            <img
                              src={
                                barber.photo_url
                              }
                              alt={
                                barber.name
                              }
                            />
                          )
                          : (
                            <UserRound
                              size={32}
                            />
                          )
                      }

                    </div>


                    <div className="booking-barber-info">

                      <strong>
                        {
                          barber.name
                        }
                      </strong>

                      <span>
                        DISPONÍVEL
                      </span>

                    </div>


                    <div className="booking-select">
                      SELECIONAR
                    </div>

                  </button>

                )
              )}

            </div>


            {availableBarbers.length ===
              0 && (

              <div className="booking-empty">

                Nenhum profissional realiza
                todos os serviços selecionados.

              </div>

            )}

          </>
        )}


        {/* PASSO 3 */}

        {step === 3 && (
          <>
            <BookingHeading
              step="PASSO 3 DE 5"
              title="Escolha a data"
              description={`${selectedServices.length} serviço(s) • ${totalDuration} min • ${selectedBarber?.name}`}
            />


            {loadingHours ? (

              <div className="booking-loading">
                Carregando agenda...
              </div>

            ) : (

              <>

                <div className="booking-calendar-header">

                  <button
                    type="button"
                    className="month-nav-button"
                    onClick={
                      previousMonth
                    }
                    disabled={
                      isAtFirstMonth
                    }
                  >
                    <ChevronLeft
                      size={16}
                    />
                  </button>


                  <strong>
                    {monthLabel}
                  </strong>


                  <button
                    type="button"
                    className="month-nav-button"
                    onClick={
                      nextMonth
                    }
                    disabled={
                      isAtLastMonth
                    }
                  >
                    <ChevronRight
                      size={16}
                    />
                  </button>

                </div>


                <div className="booking-weekdays">
                  <span>DOM</span>
                  <span>SEG</span>
                  <span>TER</span>
                  <span>QUA</span>
                  <span>QUI</span>
                  <span>SEX</span>
                  <span>SÁB</span>
                </div>


                <div className="booking-dates">

                  {calendarDays.map(
                    (
                      cell,
                      index
                    ) => {

                      if (!cell) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="booking-date empty"
                          />
                        );
                      }


                      return (
                        <button
                          type="button"
                          key={
                            cell.value
                          }
                          disabled={
                            cell.disabled
                          }
                          className={
                            cell.disabled
                              ? "booking-date disabled"
                              : selectedDate ===
                                  cell.value
                                ? "booking-date selected"
                                : "booking-date"
                          }
                          onClick={() =>
                            chooseDate(
                              cell.value
                            )
                          }
                        >
                          <strong>
                            {cell.day}
                          </strong>
                        </button>
                      );
                    }
                  )}

                </div>


                <div className="booking-legend">

                  <span>
                    <i className="legend-dot available" />
                    Disponível
                  </span>

                  <span>
                    <i className="legend-dot unavailable" />
                    Sem atendimento
                  </span>

                </div>

              </>

            )}

          </>
        )}


        {/* PASSO 4 */}

        {step === 4 && (
          <>
            <BookingHeading
              step="PASSO 4 DE 5"
              title="Escolha o horário"
              description={`${formatDate(
                selectedDate
              )} • ${totalDuration} minutos`}
            />


            {loadingTimes && (
              <div className="booking-loading">
                Consultando agenda...
              </div>
            )}


            {!loadingTimes &&
              scheduleMessage &&
              availableTimes.length ===
                0 && (

              <div className="booking-empty">

                <CalendarDays
                  size={28}
                />

                {
                  scheduleMessage
                }

              </div>

            )}


            {!loadingTimes &&
              availableTimes.length >
                0 && (

              <div className="booking-times">

                {availableTimes.map(
                  (time) => (

                    <button
                      type="button"
                      key={time}
                      onClick={() =>
                        chooseTime(
                          time
                        )
                      }
                    >
                      {time}
                    </button>

                  )
                )}

              </div>

            )}

          </>
        )}


        {/* PASSO 5 */}

        {step === 5 && (
          <>
            <BookingHeading
              step="PASSO 5 DE 5"
              title="Confirme seu agendamento"
              description="Confira as informações e informe seus dados."
            />


            <div className="booking-summary">

              <SummaryLine
                label="Serviços"
                value={
                  selectedServices
                    .map(
                      (service) =>
                        service.name
                    )
                    .join(", ")
                }
              />

              <SummaryLine
                label="Profissional"
                value={
                  selectedBarber
                    ?.name ?? ""
                }
              />

              <SummaryLine
                label="Data"
                value={
                  formatDate(
                    selectedDate
                  )
                }
              />

              <SummaryLine
                label="Horário"
                value={
                  selectedTime
                }
              />

              <SummaryLine
                label="Duração total"
                value={`${totalDuration} min`}
              />

              <SummaryLine
                label="Valor total"
                value={
                  formatPrice(
                    totalPrice
                  )
                }
              />

            </div>


            <div className="booking-customer-form">

              <div className="booking-form-title">
                SEUS DADOS
              </div>


              {confirmationError && (
                <div className="booking-form-error">
                  {confirmationError}
                </div>
              )}


              <div className="booking-field">

                <label htmlFor="customer-name">
                  NOME *
                </label>

                <input
                  id="customer-name"
                  type="text"
                  placeholder="Digite seu nome"
                  value={
                    customerName
                  }
                  disabled={
                    confirming
                  }
                  onChange={
                    (event) =>
                      setCustomerName(
                        event.target.value
                      )
                  }
                />

              </div>


              <div className="booking-field">

                <label htmlFor="customer-phone">
                  WHATSAPP *
                </label>

                <input
                  id="customer-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="(41) 99999-9999"
                  value={
                    customerPhone
                  }
                  disabled={
                    confirming
                  }
                  onChange={
                    (event) =>
                      handlePhoneChange(
                        event.target.value
                      )
                  }
                />

              </div>


              <button
                type="button"
                className="booking-confirm-button"
                disabled={
                  confirming
                }
                onClick={
                  confirmAppointment
                }
              >

                <Check
                  size={17}
                />

                {
                  confirming
                    ? "CONFIRMANDO..."
                    : "CONFIRMAR AGENDAMENTO"
                }

              </button>

            </div>

          </>
        )}


        {/* SUCESSO */}

        {step === 6 && (
          <div className="booking-success-page">

            <div className="booking-success-icon">
              <Check
                size={34}
              />
            </div>


            <div className="admin-eyebrow">
              AGENDAMENTO CONFIRMADO
            </div>


            <h1>
              Horário reservado!
            </h1>


            <p className="booking-success-text">
              Seu agendamento na Black Navalha
              foi realizado com sucesso.
            </p>


            <div className="booking-summary">

              <SummaryLine
                label="Cliente"
                value={
                  customerName
                }
              />

              <SummaryLine
                label="Serviços"
                value={
                  selectedServices
                    .map(
                      (service) =>
                        service.name
                    )
                    .join(", ")
                }
              />

              <SummaryLine
                label="Profissional"
                value={
                  selectedBarber
                    ?.name ?? ""
                }
              />

              <SummaryLine
                label="Data"
                value={
                  formatDate(
                    selectedDate
                  )
                }
              />

              <SummaryLine
                label="Horário"
                value={
                  selectedTime
                }
              />

              <SummaryLine
                label="Duração"
                value={`${totalDuration} min`}
              />

              <SummaryLine
                label="Valor"
                value={
                  formatPrice(
                    totalPrice
                  )
                }
              />

            </div>


            <div className="booking-confirmed-actions">

              <a
                className="booking-whatsapp-button"
                target="_blank"
                rel="noopener noreferrer"
                href={
                  "https://wa.me/5541995799969?text=" +
                  encodeURIComponent(
                    `Olá! Acabei de realizar um agendamento pelo site da Black Navalha.

Serviços: ${selectedServices
                      .map(
                        (service) =>
                          service.name
                      )
                      .join(", ")}
Profissional: ${selectedBarber?.name}
Data: ${formatDate(selectedDate)}
Horário: ${selectedTime}
Cliente: ${customerName}
Valor: ${formatPrice(totalPrice)}`
                  )
                }
              >
                FALAR COM A BLACK NAVALHA
              </a>


              <a
                className="booking-home-button"
                href="/agendar"
              >
                FAZER NOVO AGENDAMENTO
              </a>

            </div>


            {appointmentId && (
              <div className="appointment-reference">

                Referência:{" "}

                {
                  appointmentId
                    .slice(0, 8)
                    .toUpperCase()
                }

              </div>
            )}

          </div>
        )}

      </div>

    </main>
  );
}


/* =========================================================
   COMPONENTES
========================================================= */

function ProgressStep({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      className={
        active
          ? "progress-step active"
          : completed
            ? "progress-step completed"
            : "progress-step"
      }
    >
      <span>
        {completed
          ? (
            <Check
              size={13}
            />
          )
          : number}
      </span>

      <small>
        {label}
      </small>
    </div>
  );
}


function BookingHeading({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="booking-heading">

      <div>
        {step}
      </div>

      <h1>
        {title}
      </h1>

      <p>
        {description}
      </p>

    </div>
  );
}


function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="summary-line">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function SelectedServicesSmall({
  services,
}: {
  services: Service[];
}) {
  return (
    <div className="selected-services-small">

      {services.map(
        (service) => (

          <span key={service.id}>
            <Check size={11} />
            {service.name}
          </span>

        )
      )}

    </div>
  );
}


/* =========================================================
   CALENDÁRIO
========================================================= */

function buildCalendarMonth(
  monthDate: Date,
  activeWeekdays: Set<number>
): CalendarCell[] {
  const year =
    monthDate.getFullYear();

  const month =
    monthDate.getMonth();

  const firstWeekday =
    new Date(
      year,
      month,
      1
    ).getDay();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const cells:
    CalendarCell[] = [];


  for (
    let index = 0;
    index < firstWeekday;
    index++
  ) {
    cells.push(null);
  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    const date =
      new Date(
        year,
        month,
        day
      );

    date.setHours(
      0,
      0,
      0,
      0
    );


    const isPast =
      date.getTime() <
      today.getTime();


    const works =
      activeWeekdays.has(
        date.getDay()
      );


    cells.push({
      value:
        localDateString(
          date
        ),

      day,

      disabled:
        isPast ||
        !works,
    });
  }


  return cells;
}


/* =========================================================
   HORÁRIOS
========================================================= */

function generateAvailableTimes(
  date: string,
  workingHour: WorkingHour,
  duration: number,
  busyPeriods: BusyPeriod[]
) {
  const startMinutes =
    timeToMinutes(
      workingHour.start_time
    );

  const endMinutes =
    timeToMinutes(
      workingHour.end_time
    );

  const slots:
    string[] = [];

  const interval = 15;


  for (
    let start = startMinutes;
    start + duration <= endMinutes;
    start += interval
  ) {
    const end =
      start +
      duration;

    const slotStart =
      createAppointmentDate(
        date,
        minutesToTime(start)
      );

    const slotEnd =
      createAppointmentDate(
        date,
        minutesToTime(end)
      );


    if (
      slotStart.getTime() <=
      Date.now()
    ) {
      continue;
    }


    const conflict =
      busyPeriods.some(
        (period) => {
          const busyStart =
            new Date(
              period.start_at
            );

          const busyEnd =
            new Date(
              period.end_at
            );

          return (
            slotStart <
              busyEnd &&
            slotEnd >
              busyStart
          );
        }
      );


    if (!conflict) {
      slots.push(
        minutesToTime(
          start
        )
      );
    }
  }


  return slots;
}


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function createAppointmentDate(
  date: string,
  time: string
) {
  const [
    year,
    month,
    day,
  ] =
    date
      .split("-")
      .map(Number);

  const [
    hour,
    minute,
  ] =
    time
      .split(":")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );
}


function localDateString(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}


function getDayOfWeek(
  date: string
) {
  const [
    year,
    month,
    day,
  ] =
    date
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12
  ).getDay();
}


function timeToMinutes(
  time: string
) {
  const [
    hour,
    minute,
  ] =
    time
      .slice(
        0,
        5
      )
      .split(":")
      .map(Number);

  return (
    hour * 60 +
    minute
  );
}


function minutesToTime(
  minutes: number
) {
  const hour =
    Math.floor(
      minutes / 60
    );

  const minute =
    minutes % 60;

  return (
    String(hour).padStart(
      2,
      "0"
    ) +
    ":" +
    String(minute).padStart(
      2,
      "0"
    )
  );
}


function formatDate(
  value: string
) {
  if (!value) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }
  ).format(
    new Date(
      year,
      month - 1,
      day,
      12
    )
  );
}


function formatPrice(
  value: number | string
) {
  return Number(
    value
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}


function capitalize(
  value: string
) {
  return (
    value
      .charAt(0)
      .toUpperCase() +
    value.slice(1)
  );
}


