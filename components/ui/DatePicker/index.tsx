"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import {
  MONTHS,
  WEEKDAYS_SHORT,
  addMonths,
  formatDisplay,
  getCalendarDays,
  isSameDay,
  parseDate,
  toDateString,
} from "./utils";
import styles from "./index.module.css";

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function DatePicker({
  label,
  value,
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const lifted = open || focused || Boolean(value);

  return (
    <div
      className={styles.root}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ""}`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`${styles.value} ${!value ? styles.placeholder : ""}`}>
          {value ? formatDisplay(value) : ""}
        </span>
        <Icon name="calendar" size={16} className={styles.icon} />
      </button>

      {label && (
        <span className={`${styles.label} ${lifted ? styles.lifted : ""}`}>
          {label}
        </span>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 1100,
                damping: 24,
                mass: 0.3,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Calendar
                value={value}
                onSelect={onChange}
                onClose={() => setOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type CalendarProps = {
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

const YEARS_START = 1900;
const YEARS_END = 2027;

function Calendar({ value, onSelect, onClose }: CalendarProps) {
  const selected = parseDate(value);
  const [view, setView] = useState<Date>(selected ?? new Date());
  const [mode, setMode] = useState<"days" | "months" | "years">("days");

  const today = new Date();
  const days = getCalendarDays(view);
  const currentMonth = view.getMonth();
  const currentYear = view.getFullYear();
  const years = Array.from(
    { length: YEARS_END - YEARS_START + 1 },
    (_, i) => YEARS_START + i,
  );

  const selectDay = (day: Date) => {
    onSelect(toDateString(day));
    onClose();
  };

  const showNav = mode === "days";

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        {showNav ? (
          <button
            type="button"
            className={styles.nav}
            onClick={() => setView(addMonths(view, -1))}
            aria-label="Предыдущий месяц"
          >
            <Icon name="chevronLeft" size={16} />
          </button>
        ) : (
          <span className={styles.navPlaceholder} />
        )}

        <button
          type="button"
          className={styles.title}
          onClick={() =>
            setMode(
              mode === "days" ? "months" : mode === "months" ? "years" : "days",
            )
          }
        >
          {mode === "days" && `${MONTHS[currentMonth]} ${currentYear}`}
          {mode === "months" && currentYear}
          {mode === "years" && `${YEARS_START} — ${YEARS_END}`}
        </button>

        {showNav ? (
          <button
            type="button"
            className={styles.nav}
            onClick={() => setView(addMonths(view, 1))}
            aria-label="Следующий месяц"
          >
            <Icon name="chevronRight" size={16} />
          </button>
        ) : (
          <span className={styles.navPlaceholder} />
        )}
      </div>

      <div className={styles.body}>
        <AnimatePresence mode="wait">
          {mode === "days" && (
            <motion.div
              key="days"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <div className={styles.weekdays}>
                {WEEKDAYS_SHORT.map((w) => (
                  <span key={w} className={styles.weekday}>
                    {w}
                  </span>
                ))}
              </div>
              <div className={styles.grid}>
                {days.map((day, i) => {
                  const outside = day.getMonth() !== currentMonth;
                  const isToday = isSameDay(day, today);
                  const isSelected = selected
                    ? isSameDay(day, selected)
                    : false;

                  return (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.day} ${
                        outside ? styles.outside : ""
                      } ${isToday ? styles.today : ""} ${
                        isSelected ? styles.selected : ""
                      }`}
                      onClick={() => selectDay(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {mode === "months" && (
            <motion.div
              key="months"
              className={styles.listGrid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  className={`${styles.listItem} ${
                    i === currentMonth ? styles.listItemActive : ""
                  }`}
                  onClick={() => {
                    setView(new Date(currentYear, i, 1));
                    setMode("days");
                  }}
                >
                  {m}
                </button>
              ))}
            </motion.div>
          )}

          {mode === "years" && (
            <motion.div
              key="years"
              className={styles.listGrid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`${styles.listItem} ${
                    y === currentYear ? styles.listItemActive : ""
                  }`}
                  onClick={() => {
                    setView(new Date(y, currentMonth, 1));
                    setMode("months");
                  }}
                >
                  {y}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.footerBtn}
          onClick={() => {
            onSelect(toDateString(new Date()));
            onClose();
          }}
        >
          Сегодня
        </button>
        <button
          type="button"
          className={styles.footerBtn}
          onClick={() => {
            onSelect("");
            onClose();
          }}
        >
          Очистить
        </button>
      </div>
    </div>
  );
}
