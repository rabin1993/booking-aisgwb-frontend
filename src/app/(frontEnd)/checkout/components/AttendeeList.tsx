"use client";

import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useSettingsContext } from '@/context/useSettingsContext';

export interface Attendee {
    id: number;
    name: string;
    age: string;
    date_of_birth?: string;
    relation: string;
    ticketName?: string;
    isPrimary?: boolean;
    is_waiver?: 'yes' | 'no';
    reason_waiver?: string;
}

interface AttendeeListProps {
    attendees: Attendee[];
    onRemoveAttendee: (id: number) => void;
    onChangeAttendee: (id: number, field: string, value: string) => void;
    invalidAttendeeIds?: number[];
}

export const calculateAgeFromDob = (dobString: string): string => {
    if (!dobString) return "";
    const parts = dobString.split("-");
    let birthYear = NaN, birthMonth = NaN, birthDay = NaN;
    if (parts.length >= 3) {
        birthYear = parseInt(parts[0], 10);
        birthMonth = parseInt(parts[1], 10);
        birthDay = parseInt(parts[2], 10);
    }
    if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return "";
        birthYear = dob.getFullYear();
        birthMonth = dob.getMonth() + 1;
        birthDay = dob.getDate();
    }
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    let age = currentYear - birthYear;
    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
        age--;
    }
    return age >= 0 ? String(age) : "0";
};

const AttendeeList: React.FC<AttendeeListProps> = ({ 
    attendees, 
    onRemoveAttendee, 
    onChangeAttendee,
    invalidAttendeeIds = []
}) => {
    const { setting } = useSettingsContext();
    const underAgeLimit = parseInt(setting('general.under_age', '10')) || 10;
    const underAgeNote = setting('general.under_age_note') || setting('under_age_note') || '';
    const agedAboveLimit = parseInt(setting('general.aged_above', '70')) || 70;
    const aboveAgeNote = setting('general.aged_above_note') || setting('aged_above_note') || '';

    return (
        <div className="col-lg-8">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-1">Attendee Details</h1>
                    <p className="text-muted mb-0">Please provide the details of all individuals attending.</p>
                </div>
            </div>
            
            <div className="d-flex flex-column gap-4">
                {attendees.map((attendee, index) => {
                    const cleanBase = (attendee.ticketName || '').replace(/\s*\((Under|Aged)[^)]*\)/gi, '').trim();

                    return (
                        <div key={attendee.id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-header bg-white border-bottom pb-3 pt-4 px-4 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px' }}>
                                        {index + 1}
                                    </div>
                                    <h5 className="fs-5 fw-bold text-dark mb-0 d-flex align-items-center flex-wrap gap-2">
                                        Attendee Details
                                        {cleanBase && (
                                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill fs-sm fw-medium px-3 py-1">
                                                {cleanBase}
                                            </span>
                                        )}
                                    </h5>
                                </div>
                                {attendees.length > 1 && (
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id={`tooltip-remove-${attendee.id}`}>Remove Attendee</Tooltip>}
                                    >
                                        <button 
                                            onClick={() => onRemoveAttendee(attendee.id)}
                                            className="btn btn-sm btn-light text-danger rounded-circle p-2 d-flex align-items-center justify-content-center"
                                            style={{ width: '36px', height: '36px' }}
                                        >
                                            <IconifyIcon icon="lucide:trash-2" width="18" />
                                        </button>
                                    </OverlayTrigger>
                                )}
                            </div>
                            <div className="card-body p-4 bg-white">
                                <div className="row g-4">
                                    {attendee.isPrimary !== false ? (
                                        <>
                                            <div className="col-md-8">
                                                <label className="form-label fw-semibold">
                                                    Full Name <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    id={`attendee-name-${attendee.id}`}
                                                    type="text"
                                                    className={`form-control ${invalidAttendeeIds.includes(attendee.id) && !attendee.name?.trim() ? 'is-invalid border-danger' : ''}`}
                                                    value={attendee.name}
                                                    onChange={(e) => onChangeAttendee(attendee.id, 'name', e.target.value)}
                                                    placeholder="Enter full name"
                                                    required
                                                />
                                                {invalidAttendeeIds.includes(attendee.id) && !attendee.name?.trim() && (
                                                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                                                        <IconifyIcon icon="lucide:alert-circle" width="14" />
                                                        Full Name is required
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold d-block">Age (Below {agedAboveLimit} | {agedAboveLimit} & Above)</label>
                                                <div className="d-flex align-items-center gap-3 pt-2">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input cursor-pointer"
                                                            type="radio"
                                                            name={`age-waiver-${attendee.id}`}
                                                            id={`age-no-${attendee.id}`}
                                                            value="no"
                                                            checked={attendee.is_waiver !== 'yes'}
                                                            onChange={() => onChangeAttendee(attendee.id, 'is_waiver', 'no')}
                                                        />
                                                        <label className="form-check-label fw-medium cursor-pointer" htmlFor={`age-no-${attendee.id}`}>
                                                            Below {agedAboveLimit}
                                                        </label>
                                                    </div>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input cursor-pointer"
                                                            type="radio"
                                                            name={`age-waiver-${attendee.id}`}
                                                            id={`age-yes-${attendee.id}`}
                                                            value="yes"
                                                            checked={attendee.is_waiver === 'yes'}
                                                            onChange={() => onChangeAttendee(attendee.id, 'is_waiver', 'yes')}
                                                        />
                                                        <label className="form-check-label fw-medium cursor-pointer" htmlFor={`age-yes-${attendee.id}`}>
                                                            {agedAboveLimit} & Above
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            {aboveAgeNote && (
                                                <div className="col-12 mt-1">
                                                    <p className="small text-muted mb-0">
                                                        <strong className="text-dark">Note: </strong>{aboveAgeNote}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="col-md-5">
                                                <label className="form-label fw-semibold">
                                                    Full Name <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    id={`attendee-name-${attendee.id}`}
                                                    type="text"
                                                    className={`form-control ${invalidAttendeeIds.includes(attendee.id) && !attendee.name?.trim() ? 'is-invalid border-danger' : ''}`}
                                                    value={attendee.name}
                                                    onChange={(e) => onChangeAttendee(attendee.id, 'name', e.target.value)}
                                                    placeholder="Enter full name"
                                                    required
                                                />
                                                {invalidAttendeeIds.includes(attendee.id) && !attendee.name?.trim() && (
                                                    <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                                                        <IconifyIcon icon="lucide:alert-circle" width="14" />
                                                        Full Name is required
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold">Relation</label>
                                                <input
                                                    id={`attendee-relation-${attendee.id}`}
                                                    type="text"
                                                    className="form-control"
                                                    value={attendee.relation || ''}
                                                    onChange={(e) => onChangeAttendee(attendee.id, 'relation', e.target.value)}
                                                    placeholder="e.g. Spouse, Child"
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold d-block">Age (Above {underAgeLimit} | {underAgeLimit} & Below)</label>
                                                <div className="d-flex align-items-center gap-3 pt-2">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input cursor-pointer"
                                                            type="radio"
                                                            name={`age-waiver-${attendee.id}`}
                                                            id={`age-no-${attendee.id}`}
                                                            value="no"
                                                            checked={attendee.is_waiver !== 'yes'}
                                                            onChange={() => onChangeAttendee(attendee.id, 'is_waiver', 'no')}
                                                        />
                                                        <label className="form-check-label fw-medium cursor-pointer" htmlFor={`age-no-${attendee.id}`}>
                                                            Above {underAgeLimit}
                                                        </label>
                                                    </div>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input cursor-pointer"
                                                            type="radio"
                                                            name={`age-waiver-${attendee.id}`}
                                                            id={`age-yes-${attendee.id}`}
                                                            value="yes"
                                                            checked={attendee.is_waiver === 'yes'}
                                                            onChange={() => onChangeAttendee(attendee.id, 'is_waiver', 'yes')}
                                                        />
                                                        <label className="form-check-label fw-medium cursor-pointer" htmlFor={`age-yes-${attendee.id}`}>
                                                            {underAgeLimit} & Below
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            {underAgeNote && (
                                                <div className="col-12 mt-1">
                                                    <p className="small text-muted mb-0">
                                                        <strong className="text-dark">Note: </strong>{underAgeNote}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AttendeeList;
