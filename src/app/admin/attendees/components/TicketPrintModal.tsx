"use client";
import React, { useRef } from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";
import { AttendeeRecord } from "@/app/admin/dataStore";
import { useSettingsContext } from "@/context/useSettingsContext";
import { useAppSelector } from "@/redux/hooks";
import dayjs from "dayjs";
import { TicketTemplate } from "@/app/(frontEnd)/profile/components/TicketTemplate";

interface TicketPrintModalProps {
  show: boolean;
  onHide: () => void;
  attendee: AttendeeRecord | null;
}

const TicketPrintModal: React.FC<TicketPrintModalProps> = ({
  show,
  onHide,
  attendee,
}) => {
  const { setting } = useSettingsContext();
  const { events } = useAppSelector((state) => state.events);
  const printRef = useRef<HTMLDivElement>(null);

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
  const resolvedTicketName = shouldShowAge && effectiveAge
    ? `${cleanBase || 'Event Ticket'} (Aged ${effectiveAge})`
    : (cleanBase || 'Event Ticket');

  const eventIdStr = typeof attendee.eventId === 'string' 
    ? attendee.eventId 
    : (attendee.eventId?._id || attendee.eventId?.id);
    
  const eventDetails = events.find((e: any) => (e._id || e.id) === eventIdStr) || attendee.eventId;

  let eventDateStr = "Date TBD";
  if (eventDetails?.startDate && eventDetails?.endDate) {
    const start = dayjs(eventDetails.startDate).format("MMMM DD, YYYY");
    const end = dayjs(eventDetails.endDate).format("MMMM DD, YYYY");
    
    // Check if separate startTime/endTime exist, otherwise fallback to parsing the date or default string
    let startTime = eventDetails.startTime;
    if (!startTime) {
      const parsedStart = dayjs(eventDetails.startDate);
      startTime = parsedStart.isValid() && parsedStart.hour() !== 0 ? parsedStart.format("hh:mm A") : "10:00 AM";
    } else {
      // If startTime exists but is in 24h format like "10:00", we can try to format it
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

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Quick way to restore React event listeners after replacing body HTML
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0" />
      <Modal.Body className="pt-0 px-sm-5 pb-4">
        <div ref={printRef} className="ticket-print-area">
          <TicketTemplate 
            attendee={{
              ...attendee,
              ticketName: resolvedTicketName || 'Event Ticket',
              ticketPrice: attendee.ticketPrice || 0,
              paymentStatus: attendee.paymentStatus || attendee.bookingId?.paymentStatus || 'Completed',
              ticketStatus: attendee.ticketStatus || 'Unused'
            }} 
            eventDetails={eventDetails} 
            user={{ 
              memberId: attendee.userId?.memberId || attendee.memberId || "", 
              name: attendee.userId?.name || attendee.name || ""
            }} 
            bookingId={attendee.bookingId?._id || attendee.bookingId?.id || "N/A"} 
          />
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-center gap-3 mt-4">
          <Button 
            variant="outline-primary" 
            className="px-5 py-2 fw-medium"
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button 
            variant="primary" 
            className="px-5 py-2 fw-medium"
            style={{ backgroundColor: '#6259ca', borderColor: '#6259ca' }}
            onClick={onHide}
          >
            Cancel
          </Button>
        </div>
      </Modal.Body>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .ticket-print-area, .ticket-print-area * {
            visibility: visible;
          }
          .ticket-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
          }
        }
      `}</style>
    </Modal>
  );
};

export default TicketPrintModal;
