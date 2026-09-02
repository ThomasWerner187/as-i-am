import { useEffect, useRef, useState } from "react";
import { useEngineState, LiveRegion } from "../components/Primitives";
import { engine } from "../engine/adaptationEngine";
import { dispatchTool, toolsForEvening } from "../adaptive-contract/tools";
import { registerTools } from "../webmcp/register";
import { AGENT_ORIGIN } from "./config";
import { connectDemoBridge } from "./bridge";
import {
  FILM,
  SEATS,
  TABLE_TIMES,
  eveningStore,
  isTimeAvailable,
  money,
  seatPairs,
  tableOptions,
  useBooking,
  type EveningSite,
} from "./state";

export function BookingPage({ site }: { site: EveningSite }) {
  const adaptation = useEngineState();
  const booking = useBooking();
  const [showAll, setShowAll] = useState(false);
  const [originalLayout, setOriginalLayout] = useState(false);
  const [native, setNative] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const bookingRoot = useRef<HTMLElement>(null);
  const cinema = site === "cinema";
  const stage = cinema ? booking.cinemaStage : booking.restaurantStage;
  const largeTargets =
    Number(adaptation.active.interaction?.minimum_target_size ?? 44) > 44;
  const guided =
    largeTargets ||
    adaptation.active.cognitive?.step_by_step === true ||
    ["reduced", "minimal"].includes(
      String(adaptation.active.cognitive?.information_density),
    );
  const calm = guided && !originalLayout;
  const selectedSeats = booking.selectedSeats.map(
    (id) => SEATS.find((seat) => seat.id === id)!,
  );
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const canReview = cinema
    ? selectedSeats.length === 2
    : Boolean(booking.tableTime);
  const pairs = seatPairs();
  // Preserve the user's chosen pair when reducing the list; no silent substitution.
  const chosenPair = pairs.find((pair) =>
    pair.seats.every((seat) => booking.selectedSeats.includes(seat.id)),
  );
  const recommendations = ["F6-F7", "H5-H6", "A2-A3"].flatMap((id) =>
    pairs.filter((pair) => pair.id === id),
  );
  const pairChoices = showAll
    ? pairs
    : chosenPair
      ? [
          chosenPair,
          ...recommendations.filter((pair) => pair.id !== chosenPair.id),
        ].slice(0, 3)
      : recommendations;
  const options = tableOptions();
  const chosenTime = options.find(
    (option) => option.time === booking.tableTime,
  );
  const tableChoices = showAll
    ? options
    : chosenTime
      ? [
          chosenTime,
          ...options
            .slice(-3)
            .filter((option) => option.time !== chosenTime.time),
        ].slice(0, 3)
      : options.slice(-3);
  const chosenTimeOutsideSuggestions =
    booking.tableTime &&
    !options.some((option) => option.time === booking.tableTime);

  useEffect(() => {
    document.documentElement.dataset.evening = site;
    document.title = cinema
      ? "LUNA · Choose your seats"
      : "OLIVA · A table before the film";
    const syncPresentation = () => {
      engine.syncDom();
      const snapshot = engine.getSnapshot();
      if (window.parent !== window)
        window.parent.postMessage(
          {
            channel: "as-i-am-state",
            adapted: !snapshot.isBase,
            preview: snapshot.isPreviewingBase,
            textScale: Number(snapshot.active.visual?.text_scale ?? 1),
          },
          AGENT_ORIGIN,
        );
    };
    syncPresentation();
    const unsubscribe = engine.subscribe(syncPresentation);
    const disconnect = connectDemoBridge(site);
    // Fit the real content, avoiding a clipped confirmation button or nested scrolling.
    const observer = new ResizeObserver(() => {
      const bounds = bookingRoot.current?.getBoundingClientRect();
      if (window.parent !== window && bounds && bounds.width > 0) {
        window.parent.postMessage(
          { channel: "as-i-am-size", height: Math.ceil(bounds.height) + 2 },
          AGENT_ORIGIN,
        );
      }
    });
    if (bookingRoot.current) observer.observe(bookingRoot.current);
    let cancelled = false;
    const controller = new AbortController();
    void registerTools(
      toolsForEvening(site),
      (name, args) => dispatchTool(name, args, `${site}-booking`),
      [AGENT_ORIGIN],
      controller,
    ).then((result) => {
      if (cancelled) return;
      setNative(result.registered > 0);
      if (window.parent !== window)
        window.parent.postMessage(
          { channel: "as-i-am-ready", site, native: result.registered > 0 },
          AGENT_ORIGIN,
        );
    });
    if (new URLSearchParams(location.search).has("agent")) {
      (window as unknown as Record<string, unknown>).__aia = {
        run: (name: string, args: Record<string, unknown>) =>
          dispatchTool(name, args, `${site}-booking`),
      };
    }
    return () => {
      cancelled = true;
      controller?.abort();
      unsubscribe();
      disconnect();
      observer.disconnect();
      delete document.documentElement.dataset.evening;
    };
  }, [site, cinema]);

  useEffect(() => {
    setOriginalLayout(false);
    setShowAll(false);
  }, [guided]);
  useEffect(() => {
    if (stage !== "choose") heading.current?.focus({ preventScroll: true });
  }, [stage]);

  return (
    <div
      className={`booking-page booking-page--${site}${calm ? " is-guided" : ""}`}
    >
      <a className="skip-link" href="#main">
        Skip to selection
      </a>
      <LiveRegion />
      <main id="main" className="booking" tabIndex={-1} ref={bookingRoot}>
        <header className="booking-masthead">
          <span className="venue-logo">
            {cinema ? "LUNA" : "oliva"}
            <small>
              {cinema ? "INDEPENDENT CINEMA" : "KITCHEN & GOOD COMPANY"}
            </small>
          </span>
          <p data-aia="progress">
            <span>{stage === "choose" ? "2" : "3"} of 3</span> ·{" "}
            {stage === "choose"
              ? cinema
                ? "Seats"
                : "Your table"
              : stage === "review"
                ? "Review"
                : "Done"}
          </p>
        </header>
        <div className="booking-body">
          <aside
            className="venue-story"
            aria-label={cinema ? "Film details" : "Restaurant details"}
          >
            <div className="venue-image">
              <img
                src={cinema ? "/art/luna-poster.png" : "/art/oliva-table.png"}
                alt={
                  cinema
                    ? "An amber moon above a desert, the artwork for LUNA"
                    : "Fresh pasta with basil and tomatoes in warm evening light"
                }
              />
              {cinema && (
                <div className="poster-title" aria-hidden="true">
                  LUNA<small>SOME JOURNEYS BEGIN IN SILENCE.</small>
                </div>
              )}
            </div>
            <div className="venue-meta">
              <h2>
                {cinema
                  ? "A little further from ordinary."
                  : "Good food. Time together."}
              </h2>
              <p className="venue-time">
                {cinema ? "Tonight · 20:15" : "Dinner before the film"}
              </p>
              <p className="venue-details">
                {cinema
                  ? `${FILM.screen} · ${FILM.rating} · ${FILM.duration}`
                  : "Mediterranean · 15-minute walk to LUNA"}
              </p>
              <p
                className="venue-description"
                hidden={adaptation.active.cognitive?.hide_nonessential === true}
              >
                {cinema
                  ? "One traveller. An unfamiliar moon. A story that stays with you long after the lights come up."
                  : "Seasonal plates, handmade pasta, and a table that feels like yours. Settle in before the opening credits."}
              </p>
            </div>
          </aside>

          <section
            className="booking-task"
            aria-label={cinema ? "Seat selection" : "Table selection"}
          >
            {stage === "confirmed" ? (
              <div className="booking-success">
                <span className="success-seal" aria-hidden="true">
                  ✓
                </span>
                <p className="eyebrow">YOUR CHOICE. CONFIRMED BY YOU.</p>
                <h1 ref={heading} tabIndex={-1}>
                  {cinema
                    ? "See you under the moon."
                    : "We’ll save you a table."}
                </h1>
                <p>
                  {cinema
                    ? `${booking.selectedSeats.join(" + ")} · Tonight at 20:15 · ${money(total)} total`
                    : `Two people · Tonight at ${booking.tableTime} · No deposit`}
                </p>
                <p className="demo-notice">
                  Demo confirmation only.{" "}
                  {cinema
                    ? "No tickets purchased or payment taken."
                    : "No real reservation has been made."}
                </p>
              </div>
            ) : stage === "review" ? (
              <div className="booking-review">
                <p className="eyebrow">ONE LAST CHECK</p>
                <h1 ref={heading} tabIndex={-1}>
                  {cinema ? "Your night at LUNA." : "Your table at OLIVA."}
                </h1>
                <dl className="review-lines">
                  <div>
                    <dt>{cinema ? "Film" : "Guests"}</dt>
                    <dd>
                      {cinema
                        ? "LUNA · Tonight at 20:15"
                        : "Two people · indoors"}
                    </dd>
                  </div>
                  <div>
                    <dt>{cinema ? "Seats" : "Time"}</dt>
                    <dd>
                      {cinema
                        ? booking.selectedSeats.join(" + ")
                        : `Tonight at ${booking.tableTime}`}
                    </dd>
                  </div>
                  <div>
                    <dt>{cinema ? "Total, including all fees" : "Deposit"}</dt>
                    <dd data-aia="price">{cinema ? money(total) : "None"}</dd>
                  </div>
                </dl>
                <p>
                  {cinema
                    ? "Nothing is purchased until you confirm. This demonstration never takes a payment."
                    : "Pay for your meal at the restaurant. This demonstration does not create a real reservation."}
                </p>
                <div className="review-actions" data-aia="actions">
                  <button
                    className="booking-primary"
                    data-aia="primary"
                    onClick={() => eveningStore.confirm(site)}
                  >
                    Confirm demo {cinema ? "tickets" : "table"}{" "}
                    <span aria-hidden="true">→</span>
                  </button>
                  <button
                    className="booking-link"
                    onClick={() => eveningStore.back(site)}
                  >
                    Change selection
                  </button>
                </div>
                <p className="human-note">
                  You make the final decision. The agent cannot press this
                  confirmation through a tool.
                </p>
              </div>
            ) : (
              <>
                <div className="task-heading">
                  <p className="eyebrow">
                    {calm
                      ? "MADE EASIER FOR YOU"
                      : cinema
                        ? "MAKE A NIGHT OF IT"
                        : "YOUR EVENING, AT YOUR PACE"}
                  </p>
                  <h1 ref={heading} tabIndex={-1}>
                    {cinema
                      ? calm
                        ? "Two seats. Together."
                        : "Where would you like to sit?"
                      : calm
                        ? "A table before the film."
                        : "When shall we expect you?"}
                  </h1>
                  <p>
                    {cinema
                      ? calm
                        ? "Choose a pair. We’ll keep the next step simple."
                        : "Choose two seats for tonight’s 20:15 screening."
                      : calm
                        ? "These times leave room to eat and walk to LUNA."
                        : "Tonight · Two people · Indoors"}
                  </p>
                </div>

                {cinema ? (
                  calm ? (
                    <div className="choice-list" data-testid="seat-pair-list">
                      {pairChoices.map((pair) => (
                        <button
                          key={pair.id}
                          className={`booking-choice${pair.seats.every((seat) => booking.selectedSeats.includes(seat.id)) ? " is-selected" : ""}`}
                          aria-pressed={pair.seats.every((seat) =>
                            booking.selectedSeats.includes(seat.id),
                          )}
                          onClick={() => eveningStore.selectPair(pair.id)}
                        >
                          <span className="choice-radio" aria-hidden="true">
                            {pair.seats.every((seat) =>
                              booking.selectedSeats.includes(seat.id),
                            )
                              ? "●"
                              : ""}
                          </span>
                          <span className="choice-copy">
                            <strong>
                              Row {pair.seats[0].row} · Seats{" "}
                              {pair.seats
                                .map((seat) => seat.number)
                                .join(" + ")}
                            </strong>
                            <span>{pair.description}</span>
                          </span>
                          <span className="choice-price">
                            <strong data-aia="price">
                              {money(pair.total)}
                            </strong>
                            <span>total for two</span>
                          </span>
                        </button>
                      ))}
                      {selectedSeats.length > 0 && !chosenPair && (
                        <p role="status">
                          Your current selection:{" "}
                          {booking.selectedSeats.join(" + ")}. Choose a pair to
                          sit together, or keep your selection.
                        </p>
                      )}
                      <div className="choice-alternatives" data-aia="actions">
                        <button
                          className="booking-link"
                          onClick={() => setShowAll(!showAll)}
                        >
                          {showAll
                            ? "Show fewer pairs"
                            : "See all available pairs"}
                        </button>
                        <button
                          className="booking-link"
                          onClick={() => setOriginalLayout(true)}
                        >
                          View seat map
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="seat-map" data-testid="seat-map">
                      <div className="cinema-screen">
                        <span>SCREEN</span>
                      </div>
                      <div className="seat-rows" aria-label="Cinema seats">
                        {"ABCDEFGH".split("").map((row) => (
                          <div className="seat-row" key={row}>
                            <span className="row-label" aria-hidden="true">
                              {row}
                            </span>
                            {SEATS.filter((seat) => seat.row === row).map(
                              (seat) => (
                                <button
                                  key={seat.id}
                                  className={`seat${!seat.available ? " is-taken" : ""}${booking.selectedSeats.includes(seat.id) ? " is-selected" : ""}`}
                                  disabled={!seat.available}
                                  aria-label={`Row ${seat.row}, seat ${seat.number}, ${seat.available ? money(seat.price) : "unavailable"}`}
                                  aria-pressed={booking.selectedSeats.includes(
                                    seat.id,
                                  )}
                                  onClick={() =>
                                    eveningStore.selectSeat(seat.id)
                                  }
                                >
                                  <span
                                    className="seat-shape"
                                    aria-hidden="true"
                                  >
                                    {!seat.available
                                      ? "×"
                                      : booking.selectedSeats.includes(seat.id)
                                        ? "✓"
                                        : ""}
                                  </span>
                                </button>
                              ),
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="seat-legend">
                        <span>□ Standard {money(12)}</span>
                        <span>□ Row F · Comfort {money(13)}</span>
                        <span>× Unavailable</span>
                      </div>
                      {guided && (
                        <button
                          className="booking-link"
                          onClick={() => setOriginalLayout(false)}
                        >
                          Back to clear choices
                        </button>
                      )}
                    </div>
                  )
                ) : calm ? (
                  <div className="choice-list" data-testid="table-choice-list">
                    {tableChoices.map((option) => (
                      <button
                        key={option.time}
                        className={`booking-choice${booking.tableTime === option.time ? " is-selected" : ""}`}
                        aria-pressed={booking.tableTime === option.time}
                        onClick={() => eveningStore.selectTable(option.time)}
                      >
                        <span className="choice-radio" aria-hidden="true">
                          {booking.tableTime === option.time ? "●" : ""}
                        </span>
                        <span className="choice-copy">
                          <strong>{option.time} · Table for two</strong>
                          <span>
                            90 minutes to enjoy dinner · 15-minute walk
                          </span>
                        </span>
                        <span className="choice-price">
                          <strong>No deposit</strong>
                          <span>pay for your meal</span>
                        </span>
                      </button>
                    ))}
                    {chosenTimeOutsideSuggestions && (
                      <p role="status">
                        Your selected time, {booking.tableTime}, is kept. It
                        leaves less time before the film.
                      </p>
                    )}
                    <div className="choice-alternatives" data-aia="actions">
                      <button
                        className="booking-link"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll
                          ? "Show fewer times"
                          : "More times before the film"}
                      </button>
                      <button
                        className="booking-link"
                        onClick={() => setOriginalLayout(true)}
                      >
                        View all times
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="restaurant-times"
                    data-testid="table-time-grid"
                  >
                    <div className="table-date">
                      <span>TONIGHT</span>
                      <strong>A table for two</strong>
                      <span>Inside, by the window if possible.</span>
                    </div>
                    <div className="time-grid">
                      {TABLE_TIMES.map((time) => (
                        <button
                          key={time}
                          className={`time-option${booking.tableTime === time ? " is-selected" : ""}`}
                          disabled={!isTimeAvailable(time)}
                          aria-label={`${time}${!isTimeAvailable(time) ? ", unavailable" : ""}`}
                          aria-pressed={booking.tableTime === time}
                          onClick={() => eveningStore.selectTable(time)}
                        >
                          {time}
                          {!isTimeAvailable(time) && (
                            <span aria-hidden="true"> —</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="time-help">
                      Unavailable times are crossed out. Allow 90 minutes for
                      dinner and 15 minutes to walk to the cinema.
                    </p>
                    {guided && (
                      <button
                        className="booking-link"
                        onClick={() => setOriginalLayout(false)}
                      >
                        Back to clear choices
                      </button>
                    )}
                  </div>
                )}
                <div className="selection-footer">
                  <p aria-live="polite">
                    {cinema
                      ? selectedSeats.length
                        ? `${booking.selectedSeats.join(" + ")} · ${money(total)} total`
                        : "Your seats are waiting."
                      : booking.tableTime
                        ? `${booking.tableTime} · Two people · No deposit`
                        : "A good evening starts around a table."}
                  </p>
                  <button
                    className="booking-primary"
                    data-aia="primary"
                    disabled={!canReview}
                    onClick={() => eveningStore.review(site)}
                  >
                    Review selection <span aria-hidden="true">→</span>
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
        <footer className="booking-footer">
          <span>
            Synthetic demo · No real {cinema ? "purchases" : "reservations"}
          </span>
          <span>
            {native ? "WebMCP connected" : "Manual experience available"}{" "}
            <span aria-hidden="true">↗</span>
          </span>
        </footer>
      </main>
    </div>
  );
}
