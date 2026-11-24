"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Button, Spinner, Alert, Row, Col } from "react-bootstrap";
import { useAppDispatch } from "@/redux/hooks";
import { fetchAttendeeById, updateAttendee } from "@/redux/slices/admin/attendeeSlice";
import { AttendeeRecord } from "@/app/admin/dataStore";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import { useSettingsContext } from "@/context/useSettingsContext";

const ScannerContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { setting } = useSettingsContext();
  const underAgeLimit = parseInt(setting('general.under_age', '10')) || 10;
  const agedAboveLimit = parseInt(setting('general.aged_above', '70')) || 70;

  const [loading, setLoading] = useState(true);
  const [attendee, setAttendee] = useState<AttendeeRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const attendeeId = searchParams.get("attendeeId");
  const eventId = searchParams.get("eventId");
  const ticketId = searchParams.get("ticketId");

  useEffect(() => {
    if (!attendeeId) {
      setError("Invalid QR Code: Missing Attendee ID");
      setLoading(false);
      return;
    }

    const loadAttendee = async () => {
      try {
        const data = await dispatch(fetchAttendeeById({
          id: attendeeId,
          eventId: eventId || undefined,
          ticketId: ticketId || undefined
        })).unwrap();
        setAttendee(data);
      } catch (err: any) {
        setError(err || "Failed to load attendee details");
      } finally {
        setLoading(false);
      }
    };

    loadAttendee();
  }, [attendeeId, eventId, ticketId, dispatch]);

  const handleMarkAsUsed = async () => {
    if (!attendee) return;
    
    setUpdating(true);
    try {
      const payload = { 
        ticketStatus: "Used",
        checkInTime: new Date().toISOString()
      };
      const updateId = (attendee._id || attendee.id || attendeeId) as string;
      await dispatch(updateAttendee({ id: updateId, payload })).unwrap();
      
      setAttendee({ ...attendee, ticketStatus: "Used" });
      
      Swal.fire({
        title: "Success",
        text: "Pass marked as Used!",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#6259ca"
      });
    } catch (err: any) {
      Swal.fire({
        title: "Attention!",
        text: err || "Failed to update pass status",
        icon: "warning",
        confirmButtonColor: "#d33"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading pass details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center p-5 shadow-sm border-0">
        <Icon icon="mdi:close-circle" width="60" className="text-danger mx-auto mb-3" />
        <h4 className="text-danger mb-3">Attention!</h4>
        <p className="text-muted mb-4">
          {error.toLowerCase().includes("not found")
            ? "Invalid QR Code. This pass may have been deleted or does not exist in the database."
            : error}
        </p>
        <div className="d-flex justify-content-center gap-2">
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
          <Button variant="outline-secondary" onClick={() => router.push("/admin/attendees")}>
            Back to Attendees
          </Button>
        </div>
      </Card>
    );
  }

  if (!attendee) return null;

  const isUsed = attendee.ticketStatus === "Used";
  const isCancelled = attendee.ticketStatus === "Cancelled";
  const rawPayStatus = (
    attendee.paymentStatus || 
    (typeof attendee.bookingId === 'object' ? attendee.bookingId?.paymentStatus : undefined) || 
    'Success'
  ).toString();
  const isPaymentValid = ['success', 'completed', 'free'].includes(rawPayStatus.toLowerCase());

  const rawTicketName = (
    attendee.ticketName || 
    (typeof attendee.ticketId === 'object' ? attendee.ticketId?.ticketName : attendee.ticketId) || 
    'Event Pass'
  ).toString();
  const cleanBaseName = rawTicketName.replace(/\s*\((Under|Aged)[^)]*\)/gi, '').trim();

  let ageNum = parseInt(attendee.age as string);
  if (isNaN(ageNum) && (attendee as any).date_of_birth) {
    const dobParts = String((attendee as any).date_of_birth).split('-');
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
    (attendee as any).relation ||
    cleanBaseName.toLowerCase().includes('accompany') ||
    rawTicketName.toLowerCase().includes('accompany') ||
    (attendee as any).isPrimary === false
  );

  const isUnderAge = isAccompanying && !isNaN(ageNum) && ageNum <= underAgeLimit;
  const isAboveAge = !isAccompanying && !isNaN(ageNum) && ageNum >= agedAboveLimit;
  const shouldShowAge = isUnderAge || isAboveAge;

  const effectiveAge = attendee.age || (!isNaN(ageNum) ? String(ageNum) : '');
  const displayTicketType = shouldShowAge && effectiveAge
    ? `${cleanBaseName} (Aged ${effectiveAge})`
    : rawTicketName;
  const eventTitle = typeof attendee.eventId === 'object' ? attendee.eventId?.title : (attendee.eventId || 'AISGWB Event');

  return (
    <Card className="border-0 mx-auto">
      <Card.Body className="text-center">
        <div className="mb-4">
          <Icon 
            icon={isUsed ? "mdi:ticket-confirmation" : (isCancelled ? "mdi:ticket-percent" : "mdi:qrcode-scan")} 
            width="80" 
            className={isUsed ? "text-success" : (isCancelled ? "text-danger" : "text-primary")} 
          />
        </div>
        
        <h3 className="fw-bold mb-2">{attendee.name}</h3>
        <p className="text-muted mb-4">Pass Verification</p>

        <div className="bg-light rounded p-4 mb-4 text-start">
          <Row className="mb-3">
            <Col xs={5} className="text-muted fw-bold small text-uppercase">Pass Status</Col>
            <Col xs={7}>
              {isUsed && <span className="badge bg-success">Used</span>}
              {isCancelled && <span className="badge bg-danger">Cancelled</span>}
              {!isUsed && !isCancelled && <span className="badge bg-primary">Unused</span>}
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={5} className="text-muted fw-bold small text-uppercase">Payment Status</Col>
            <Col xs={7}>
              <span className={`badge ${isPaymentValid ? 'bg-success' : (rawPayStatus.toLowerCase() === 'failed' ? 'bg-danger' : 'bg-warning')}`}>
                {rawPayStatus}
              </span>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={5} className="text-muted fw-bold small text-uppercase">Pass For</Col>
            <Col xs={7} className="fw-medium">
              {displayTicketType}
            </Col>
          </Row>
          <Row>
            <Col xs={5} className="text-muted fw-bold small text-uppercase">Event</Col>
            <Col xs={7} className="fw-medium">{eventTitle}</Col>
          </Row>
        </div>

        {isCancelled ? (
          <Alert variant="danger">
            This pass has been cancelled. Do not allow entry.
          </Alert>
        ) : !isPaymentValid ? (
          <Alert variant="warning">
            Payment status is <strong>{attendee.paymentStatus}</strong>. Entry cannot be granted.
          </Alert>
        ) : isUsed ? (
          <Alert variant="success" className="mb-0">
            <Icon icon="mdi:check-circle" className="me-2" />
            This pass has already been used!
          </Alert>
        ) : (
          <Button 
            variant="primary" 
            size="lg" 
            className="w-100 py-3 fw-bold"
            onClick={handleMarkAsUsed}
            disabled={updating}
          >
            {updating ? (
              <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/> Updating...</>
            ) : (
              "Mark Pass as Used"
            )}
          </Button>
        )}
        
        <div className="mt-4">
          <Button variant="link" className="text-muted text-decoration-none" onClick={() => router.push("/admin/attendees")}>
            <Icon icon="mdi:arrow-left" className="me-1" /> Back to Attendees
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ScannerContent;
