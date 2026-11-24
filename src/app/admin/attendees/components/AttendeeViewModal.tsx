"use client";
import React, { useState } from "react";
import { Modal, Button, Row, Col, Badge } from "react-bootstrap";
import { AttendeeRecord } from "@/app/admin/dataStore";
import { useAppSelector } from "@/redux/hooks";
import { useSettingsContext } from "@/context/useSettingsContext";
import { TicketTemplate } from "@/app/(frontEnd)/profile/components/TicketTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

interface AttendeeViewModalProps {
  show: boolean;
  onHide: () => void;
  attendee: AttendeeRecord | null;
}

const AttendeeViewModal: React.FC<AttendeeViewModalProps> = ({
  show,
  onHide,
  attendee,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { events } = useAppSelector((state) => state.events);
  const { setting } = useSettingsContext();

  if (!attendee) return null;

  const underAgeLimit = parseInt(setting('general.under_age', '10')) || 10;
  const agedAboveLimit = parseInt(setting('general.aged_above', '70')) || 70;

  const rawTicketName = attendee.ticketName || attendee.ticketId?.ticketName || '';
  const cleanBase = rawTicketName.replace(/\s*\((Under|Aged)[^)]*\)/gi, '').trim();

  let ageNum = parseInt(attendee.age);
  if (isNaN(ageNum) && attendee.date_of_birth) {
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
    attendee.relation ||
    cleanBase.toLowerCase().includes('accompany') ||
    rawTicketName.toLowerCase().includes('accompany') ||
    attendee.isPrimary === false
  );

  const isUnderAge = isAccompanying && !isNaN(ageNum) && ageNum <= underAgeLimit;
  const isAboveAge = !isAccompanying && !isNaN(ageNum) && ageNum >= agedAboveLimit;
  const shouldShowAge = isUnderAge || isAboveAge;

  const effectiveAge = attendee.age || (!isNaN(ageNum) ? String(ageNum) : '');
  const safeTicketName = shouldShowAge && effectiveAge
    ? `${cleanBase || 'Event Pass'} (Aged ${effectiveAge})`
    : (cleanBase || 'N/A');

  const eventIdStr = typeof attendee.eventId === 'string' 
    ? attendee.eventId 
    : (attendee.eventId?._id || attendee.eventId?.id);
  let eventDetails = events.find((e: any) => (e._id || e.id) === eventIdStr) || attendee.eventId;

  const isUsed = (attendee.ticketStatus || attendee.status)?.toLowerCase() === 'used';

  const handleDownloadTicket = async () => {
    if (isUsed) {
      toast.error("This pass has already been used and cannot be downloaded.");
      return;
    }

    setIsDownloading(true);

    if (!eventDetails?.venueLocation && !eventDetails?.venue) {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
        if (eventIdStr) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/events/${eventIdStr}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          });
          const data = await res.json();
          if (data && data.data) {
            eventDetails = data.data;
          }
        }
      } catch (e) {
        console.error("Failed to fetch full event details", e);
      }
    }

    setTimeout(async () => {
      try {
        const ticketEl = document.getElementById(`admin-attendee-ticket-${attendee._id || attendee.id}`);
        if (ticketEl) {
          const tCanvas = await html2canvas(ticketEl, { scale: 2, useCORS: true, logging: true });
          const tImgData = tCanvas.toDataURL("image/png");
          const tPdf = new jsPDF("p", "mm", "a4");
          const tPdfWidth = tPdf.internal.pageSize.getWidth();
          const tPdfHeight = (tCanvas.height * tPdfWidth) / tCanvas.width;
          tPdf.addImage(tImgData, "PNG", 0, 0, tPdfWidth, tPdfHeight);
          tPdf.save(`ticket-${attendee._id || attendee.id}.pdf`);
          toast.success("Pass downloaded successfully!");
        } else {
          toast.error("Could not generate PDF. Template not found.");
        }
      } catch (error: any) {
        console.error("Pass PDF generation error", error);
        toast.error("Failed to generate pass PDF");
      } finally {
        setIsDownloading(false);
      }
    }, 500);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton className="border-0 pb-0"></Modal.Header>
        <Modal.Body className="text-center pt-0 px-4 pb-4">
          <h5 className="fw-semibold lh-base mb-3 text-dark px-3">
            {attendee.eventId?.title || "Event Title"}
          </h5>

          <div
            className="border-top my-3"
            style={{ borderColor: "#e9ecef", borderStyle: "dashed", borderWidth: "1px" }}
          ></div>

          <Row className="text-start mb-2 px-3">
            <Col xs={6}>
              <div className="text-muted small mb-1">Pass ID:</div>
              <div className="fw-medium text-dark mb-3">
                {(attendee._id || attendee.id)?.slice(-10) || "N/A"}
              </div>

              <div className="text-muted small mb-1">Attendee:</div>
              <div className="fw-medium text-dark mb-3">{attendee.name}</div>
            </Col>
            <Col xs={6}>
              <div className="text-muted small mb-1">Pass For:</div>
              <div className="fw-medium text-dark mb-3">
                {safeTicketName}
              </div>

              <div className="text-muted small mb-1">Price:</div>
              <div className="fw-medium text-dark mb-3">
                ₹{attendee.ticketPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>

            </Col>
          </Row>

          <div
            className="border-top my-3"
            style={{ borderColor: "#e9ecef", borderStyle: "dashed", borderWidth: "1px" }}
          ></div>

          {!isUsed ? (
            <Button
              variant="primary"
              className="px-4 py-2 mt-2 d-inline-flex align-items-center gap-2"
              style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
              onClick={handleDownloadTicket}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Downloading...</>
              ) : (
                "Download PDF"
              )}
            </Button>
          ) : (
            <Badge bg="primary-subtle" text="primary" className="px-3 py-2 fs-13 rounded-pill fw-semibold mt-2">
              Pass Used
            </Badge>
          )}
        </Modal.Body>
      </Modal>

      <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
        <div id={`admin-attendee-ticket-${attendee._id || attendee.id}`}>
          <TicketTemplate 
            attendee={{
              ...attendee,
              ticketName: safeTicketName !== "N/A" ? safeTicketName : 'Event Pass',
              ticketPrice: attendee.ticketPrice || 0,
              paymentStatus: attendee.paymentStatus || attendee.bookingId?.paymentStatus || 'Completed',
              ticketStatus: attendee.status || attendee.ticketStatus || 'Unused',
              ticketId: attendee.ticketId?._id || attendee.ticketId?.id || attendee.ticketId || ''
            }} 
            eventDetails={eventDetails} 
            user={attendee.bookingId?.userId || attendee.bookingId?.billingInfo || { name: attendee.name || 'Guest' }} 
            bookingId={attendee.bookingId?._id || attendee.bookingId?.id || "N/A"} 
            pdfMode={true}
          />
        </div>
      </div>
    </>
  );
};

export default AttendeeViewModal;
