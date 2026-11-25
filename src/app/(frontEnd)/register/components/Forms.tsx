"use client";
import OTPInput from "@/components/OTPInput";
import Icon from "@/components/wrappers/Icon";
import { FormEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { frontendSendOtp, frontendVerifyRegistrationOtp } from "@/redux/slices/frontEnd/userSlice";
import {
  Alert,
  Button,
  Form,
  FormCheck,
  FormControl,
  FormLabel,
  InputGroup,
} from "react-bootstrap";
import toast from "react-hot-toast";

const cleanMobileNumber = (val: string): string => {
  let cleaned = val.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
};

const Forms = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [sex, setSex] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && step === 2) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, step]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };
  

  const handleProceedToOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    const newErrors: Record<string, string> = {};
    const cleanMobile = cleanMobileNumber(mobileNo);

    if (!fullName.trim()) newErrors.fullName = "Full Name is required";
    
    if (!email.trim()) {
      newErrors.email = "Email Address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!cleanMobile) {
      newErrors.mobileNo = "Mobile Number is required";
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      newErrors.mobileNo = "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)";
    }

    if (!sex) newErrors.sex = "Sex is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the Terms & Policy to register.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        name: fullName.trim(),
        groupId: "GRP-3",
        sex,
        email: email.trim(),
        mobile: cleanMobile,
        username: email.trim(),
        password: "TempPassword123!",
      };

      const res = await dispatch(frontendSendOtp(payload)).unwrap();

      setOtpCode(Array(6).fill(""));
      setCountdown(300);
      setStep(2);
      const successMsg =
        res?.data?.message ||
        res?.message ||
        `Verification code sent to ${email.trim()} and +91 ${cleanMobile}`;
      toast.success(successMsg);
    } catch (err: any) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to send OTP. Please try again.";
      if (typeof msg === "string") {
        if (msg.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: msg }));
        } else if (msg.toLowerCase().includes("mobile") || msg.toLowerCase().includes("phone")) {
          setErrors((prev) => ({ ...prev, mobileNo: msg }));
        } else {
          setError(msg);
        }
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpCode(Array(6).fill(""));
    setError(null);
    try {
      setLoading(true);
      const cleanMobile = cleanMobileNumber(mobileNo);
      const payload = {
        name: fullName.trim(),
        groupId: "GRP-3",
        sex,
        email: email.trim(),
        mobile: cleanMobile,
        username: email.trim(),
        password: "TempPassword123!",
      };
      const res = await dispatch(frontendSendOtp(payload)).unwrap();
      setCountdown(300);
      const successMsg =
        res?.data?.message ||
        res?.message ||
        `Verification code sent to ${email.trim()} and +91 ${cleanMobile}`;
      toast.success(successMsg);
    } catch (err: any) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to resend OTP. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (countdown === 0) {
      setError("Verification code has expired. Please click Resend OTP to get a new code.");
      return;
    }

    const code = otpCode.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      
      await dispatch(frontendVerifyRegistrationOtp({ email: email.trim(), otp: code })).unwrap();
      
      sessionStorage.setItem("show_frontend_login_toast", "true");
      
      window.location.href = "/profile";
    } catch (err: any) {
      const msg = typeof err === "string" ? err : err?.message || err?.error || "Registration failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert
          variant="danger"
          className="d-flex align-items-center gap-2 py-2 fs-13"
        >
          <Icon icon="alert-circle" className="fs-18 flex-shrink-0" />
          <div>{error}</div>
        </Alert>
      )}

      {step === 1 ? (
        <Form onSubmit={handleProceedToOtp} noValidate>
          <div className="row">
            <div className="col-md-12 mb-3">
              <FormLabel className="fw-semibold">
                Full Name <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="text"
                placeholder="Enter full name..."
                value={fullName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFullName(val);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                isInvalid={!!errors.fullName}
              />
              <Form.Control.Feedback type="invalid" className="fs-13">
                {errors.fullName}
              </Form.Control.Feedback>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12 mb-3">
              <FormLabel className="fw-semibold">
                Email Address <span className="text-danger">*</span>
              </FormLabel>
              <FormControl
                type="email"
                placeholder="Enter email address..."
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid" className="fs-13">
                {errors.email}
              </Form.Control.Feedback>
            </div>
            <div className="col-md-12 mb-3">
              <FormLabel className="fw-semibold">
                Mobile Number <span className="text-danger">*</span>
              </FormLabel>
              <InputGroup hasValidation>
                <InputGroup.Text className="bg-light text-muted fw-semibold fs-13">
                  +91
                </InputGroup.Text>
                <FormControl
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  value={mobileNo}
                  onChange={(e) => {
                    const raw = e.target.value;
                    let digits = raw.replace(/\D/g, "");
                    if (digits.length === 12 && digits.startsWith("91")) {
                      digits = digits.slice(2);
                    } else if (digits.length === 11 && digits.startsWith("0")) {
                      digits = digits.slice(1);
                    }
                    digits = digits.slice(0, 10);
                    setMobileNo(digits);
                    if (errors.mobileNo) setErrors((prev) => ({ ...prev, mobileNo: "" }));
                  }}
                  isInvalid={!!errors.mobileNo}
                />
                <Form.Control.Feedback type="invalid" className="fs-13">
                  {errors.mobileNo}
                </Form.Control.Feedback>
              </InputGroup>
              <small className="text-muted fs-11 mt-1 d-block">
                Enter valid 10-digit Indian mobile number (e.g. 9876543210)
              </small>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12 mb-3">
              <FormLabel className="fw-semibold">
                Sex <span className="text-danger">*</span>
              </FormLabel>
              <div className="d-flex gap-4 mt-2">
                <FormCheck type="radio" id="sexMale" className="d-flex align-items-center gap-2">
                  <FormCheck.Input 
                    type="radio" 
                    name="sex" 
                    value="Male"
                    checked={sex === "Male"}
                    onChange={(e) => {
                      setSex(e.target.value);
                      if (errors.sex) setErrors((prev) => ({ ...prev, sex: "" }));
                    }}
                    isInvalid={!!errors.sex}
                    className="mt-0"
                  />
                  <FormCheck.Label className="mb-0">Male</FormCheck.Label>
                </FormCheck>
                <FormCheck type="radio" id="sexFemale" className="d-flex align-items-center gap-2">
                  <FormCheck.Input 
                    type="radio" 
                    name="sex" 
                    value="Female"
                    checked={sex === "Female"}
                    onChange={(e) => {
                      setSex(e.target.value);
                      if (errors.sex) setErrors((prev) => ({ ...prev, sex: "" }));
                    }}
                    isInvalid={!!errors.sex}
                    className="mt-0"
                  />
                  <FormCheck.Label className="mb-0">Female</FormCheck.Label>
                </FormCheck>
              </div>
              {errors.sex && <div className="text-danger fs-13 mt-1">{errors.sex}</div>}
            </div>
          </div>

          <div className="mb-3">
            <FormCheck>
              <Form.Check.Input
                className="form-check-input-light fs-14"
                type="checkbox"
                id="termAndPolicy"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <Form.Check.Label htmlFor="termAndPolicy" className="fs-13">
                I agree to the Terms of Service &amp; Privacy Policy
              </Form.Check.Label>
            </FormCheck>
          </div>

          <div className="d-grid">
            <Button
              variant="primary"
              type="submit"
              className="fw-semibold py-2 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              <Icon icon="shield-check" />
              {loading ? "Sending OTP..." : "Continue to OTP Verification"}
            </Button>
          </div>
        </Form>
      ) : (
        <Form onSubmit={handleCompleteRegistration}>
          <div className="p-3 bg-light rounded border mb-3">
            <div className="mb-3">
              <span className="fs-14 fw-semibold text-success d-flex align-items-center gap-1 mb-2">
                <Icon icon="check-circle" className="fs-16" /> Verification Code Sent!
              </span>
              <div className="p-2 rounded bg-white border fs-12 text-muted d-flex flex-column gap-1">
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="mail" className="text-primary flex-shrink-0" />
                  <span>Email: <strong className="text-dark">{email.trim()}</strong></span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Icon icon="phone" className="text-success flex-shrink-0" />
                  <span>Mobile: <strong className="text-dark">+91 {cleanMobileNumber(mobileNo)}</strong></span>
                </div>
              </div>
            </div>

            <OTPInput
              code={otpCode}
              setCode={setOtpCode}
              label="Enter Registration Verification Code"
            />

            <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <span
                className={`fs-12 d-flex align-items-center ${
                  countdown > 0 ? "text-muted" : "text-danger fw-semibold"
                }`}
              >
                <Icon icon="clock" className="me-1" />
                {countdown > 0 ? (
                  <>
                    Expires in:{" "}
                    <strong className="text-dark ms-1">
                      {formatCountdown(countdown)}
                    </strong>
                  </>
                ) : (
                  <>OTP Expired</>
                )}
              </span>
              <div className="d-flex align-items-center gap-3">
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-decoration-underline fs-12"
                  onClick={handleResendOtp}
                  type="button"
                  disabled={loading}
                >
                  Resend OTP
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-muted fs-12"
                  onClick={() => {
                    setOtpCode(Array(6).fill(""));
                    setCountdown(0);
                    setStep(1);
                  }}
                  type="button"
                >
                  Edit Details
                </Button>
              </div>
            </div>
          </div>

          <div className="d-grid gap-2">
            <Button
              variant="primary"
              type="submit"
              className="fw-semibold py-2 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              <Icon icon="user-plus" />
              {loading
                ? "Creating Account..."
                : "Complete Account Verification"}
            </Button>
            <Button
              variant="light"
              type="button"
              onClick={() => {
                setOtpCode(Array(6).fill(""));
                setCountdown(0);
                setStep(1);
              }}
              className="fw-semibold"
            >
              Back
            </Button>
          </div>
        </Form>
      )}
    </>
  );
};

export default Forms;
