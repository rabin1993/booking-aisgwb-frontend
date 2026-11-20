"use client";
import React, { forwardRef } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { setting } from "@/context/useSettingsContext";

interface TicketTemplateProps {
  attendee: any;
  eventDetails: any;
  user: any;
  pdfMode?: boolean;
  bookingId?: string;
}

export const TicketTemplate = forwardRef<HTMLDivElement, TicketTemplateProps>(({ attendee, eventDetails, user, pdfMode }, ref) => {
  const eventTitle = eventDetails?.title || "Event Title";
  const eventVenue = eventDetails?.venueLocation || eventDetails?.venue || "Venue TBD";
  
  let eventDateStr = "Date TBD";
  if (eventDetails?.startDate && eventDetails?.endDate) {
    const start = dayjs(eventDetails.startDate).format("MMMM DD, YYYY");
    const end = dayjs(eventDetails.endDate).format("MMMM DD, YYYY");
    
    let startTime = eventDetails.startTime;
    if (!startTime) {
      const parsedStart = dayjs(eventDetails.startDate);
      startTime = parsedStart.isValid() && parsedStart.hour() !== 0 ? parsedStart.format("hh:mm A") : "10:00 AM";
    } else {
      const [h, m] = startTime.split(':');
      if (h && m) {
        const hour = parseInt(h, 10);
        const formattedHour = hour % 12 || 12;
        startTime = `${String(formattedHour).padStart(2, '0')}:${m}`;
      }
    }
    
    let endTime = eventDetails.endTime;
    if (!endTime) {
      const parsedEnd = dayjs(eventDetails.endDate);
      endTime = parsedEnd.isValid() && parsedEnd.hour() !== 0 ? parsedEnd.format("hh:mm A") : "06:00 PM";
    } else {
      const [h, m] = endTime.split(':');
      if (h && m) {
        const hour = parseInt(h, 10);
        const formattedHour = hour % 12 || 12;
        endTime = `${String(formattedHour).padStart(2, '0')}:${m}`;
      }
    }

    eventDateStr = `${start} - ${end} @ ${startTime} - ${endTime}`;
  }

  const frontendUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || '');
  const tId = typeof attendee?.ticketId === 'string' ? attendee.ticketId : (attendee?.ticketId?._id || attendee?.ticketId?.id || '');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
      `${frontendUrl}/admin/attendees/scanner?eventId=${eventDetails?.id || eventDetails?._id || ''}&attendeeId=${attendee?.id || attendee?._id || 'temp'}&ticketId=${tId}`
  )}`;

  const underAgeLimit = parseInt(setting('general.under_age', '10')) || 10;
  const agedAboveLimit = parseInt(setting('general.aged_above', '70')) || 70;
  let ageNum = parseInt(attendee?.age);
  if (isNaN(ageNum) && attendee?.date_of_birth) {
    const dobParts = String(attendee.date_of_birth).split('-');
    if (dobParts.length >= 3) {
      const bYear = parseInt(dobParts[0], 10);
      const bMonth = parseInt(dobParts[1], 10);
      const bDay = parseInt(dobParts[2], 10);
      if (!isNaN(bYear)) {
        const today = new Date();
        let calcAge = today.getFullYear() - bYear;
        const curM = today.getMonth() + 1;
        const curD = today.getDate();
        if (curM < bMonth || (curM === bMonth && curD < bDay)) calcAge--;
        if (calcAge >= 0) ageNum = calcAge;
      }
    }
  }

  const isAccompanying = Boolean(
    attendee?.relation ||
    attendee?.ticketName?.toLowerCase().includes('accompany') ||
    attendee?.isPrimary === false
  );
  const isUnderAge = isAccompanying && !isNaN(ageNum) && ageNum <= underAgeLimit;
  const isAboveAge = !isAccompanying && !isNaN(ageNum) && ageNum >= agedAboveLimit;
  const shouldShowAgeInType = isUnderAge || isAboveAge;

  const cleanBase = (attendee?.ticketName || '').replace(/\s*\((Under|Aged)[^)]*\)/gi, '').trim();
  const effectiveAge = attendee?.age || (!isNaN(ageNum) ? String(ageNum) : '');
  const displayTicketType = shouldShowAgeInType && effectiveAge
    ? `${cleanBase} (Aged ${effectiveAge})`
    : cleanBase;
  const isFree = attendee?.ticketPrice == 0 || !attendee?.ticketPrice || shouldShowAgeInType;

  let dobFormatted = 'N/A';
  if (attendee?.date_of_birth) {
    const parts = String(attendee.date_of_birth).split('-');
    if (parts.length === 3) {
      dobFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
    } else {
      dobFormatted = String(attendee.date_of_birth);
    }
  } else if (isAboveAge && !isNaN(ageNum)) {
    const approxYear = new Date().getFullYear() - ageNum;
    dobFormatted = `01-01-${approxYear}`;
  }

  return (
    <div 
      ref={ref} 
      className={`conference-pass p-4 ${pdfMode ? '' : 'w-100'}`}
    >
      <div className="event-header justify-content-center">
        <div className="left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={setting("general.logo", "/images/logo.png")}
            alt="Event Logo" 
            className="event-logo"
            crossOrigin="anonymous"
          />
        </div>
        <div className="right">
          <h1 className="event-title">{eventTitle}</h1>
          <div className="event-meta">Venue: {eventVenue}</div>
          <div className="event-meta">{eventDateStr}</div>
        </div>
      </div>

      <div className="details-section">
        <div className="lefts">
          <div className="left1">
            <div className="detail-item">
              <span className="detail-label">BOOKED BY :</span>
              <span className="detail-value">{user?.name || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">TYPE :</span>
              <span className="detail-value">{displayTicketType || attendee.ticketName || ''}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">PAYMENT STATUS :</span>
              <span className="detail-value">{attendee.paymentStatus || ''}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">ATTENDEE :</span>
              <span className="detail-value">{attendee.name}</span>
            </div>
          </div>
          <div className="right1">
            <div className="detail-item">
              <span className="detail-label">MEMBERSHIP ID :</span>
              <span className="detail-value">{user?.memberId || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">PRICE :</span>
              <span className="detail-value">{isFree ? "FREE" : `₹ ${attendee.ticketPrice}`}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">STATUS :</span>
              <span className="detail-value">{attendee.ticketStatus || ''}</span>
            </div>
            {isAboveAge ? (
              <div className="detail-item">
                <span className="detail-label">DATE OF BIRTH :</span>
                <span className="detail-value">{dobFormatted}</span>
              </div>
            ) : isUnderAge && effectiveAge ? (
              <>
                <div className="detail-item">
                  <span className="detail-label">AGE :</span>
                  <span className="detail-value">{effectiveAge}</span>
                </div>
                {attendee?.relation && (
                  <div className="detail-item">
                    <span className="detail-label">RELATION :</span>
                    <span className="detail-value">{attendee.relation}</span>
                  </div>
                )}
              </>
            ) : attendee?.relation ? (
              <div className="detail-item">
                <span className="detail-label">RELATION :</span>
                <span className="detail-value">{attendee.relation}</span>
              </div>
            ) : (
              <div className="detail-item" style={{ visibility: 'hidden' }}>
                <span className="detail-label">-</span>
                <span className="detail-value">-</span>
              </div>
            )}
          </div>
        </div>
        <div className="rights">
          <div className="col-md-auto">
            <div className="qr-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={qrUrl} 
                alt="QR Code" 
                className="qr-image" 
                crossOrigin="anonymous"
              />
              <div className="qr-title">SCAN QR CODE</div>
            </div>
          </div>
        </div>
      </div>

      <div className="notice-section">
        <p className="notice-gap">{setting('general.ticket_description', '')}</p>
      </div>
      <div className="footer-info">
        {setting('seo.meta_description', '')}<br />
        {setting('general.website_address', '')}<br />
        Contact No. {setting('general.contact', '')} Email: {setting('general.support_email', '')} Website: {setting('general.website_url', '')}
      </div>
    </div>
  );
});

TicketTemplate.displayName = "TicketTemplate";
