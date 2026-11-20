"use client";
import { currentYear, META_DATA } from "@/config/constants";
import { Icon as IconifyIcon } from "@iconify/react";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import { useSettingsContext } from "@/context/useSettingsContext";
const Footer = () => {
  const { setting } = useSettingsContext();
  const facebook = setting("general.facebook", "");
  const youtube = setting("general.youtube", "");
  const email = setting("general.support_email", META_DATA.email);
  const address = setting("general.website_address", "");
  return (
    <footer className="section-custom section-footer pt-5 pb-3">
      <Container>
        <Row className="g-4 justify-content-between">
          <Col lg={4}>
            <h4>Quick link</h4>
            <ul className="footer-link">
              <li>
                <Link href="https://aisgwb.org/about" className="text-white">About Us</Link>
              </li>
              <li>
                <Link href="https://aisgwb.org/members" className="text-white">Members</Link>
              </li>
              <li>
                <Link href="https://aisgwb.org/contact-us" className="text-white">Contact Us</Link>
              </li>
              <li>
                <Link href="https://booking.aisgwb.org" className="text-white">Events</Link>
              </li>
            </ul>
            <div className="social-links">
              <h5 className="text-white">Follow Us</h5>
              <ul>
                <li>
                  <Link
                    href={facebook || "#"}
                    target={facebook ? "_blank" : undefined}
                    rel={facebook ? "noopener noreferrer" : undefined}
                    aria-label="Facebook"
                  >
                    <IconifyIcon icon="simple-icons:facebook" width="24" height="24" />
                  </Link>
                </li>
                <li>
                  <Link
                    href={youtube || "#"}
                    target={youtube ? "_blank" : undefined}
                    rel={youtube ? "noopener noreferrer" : undefined}
                    aria-label="YouTube"
                  >
                    <IconifyIcon icon="simple-icons:youtube" width="24" height="24" />
                  </Link>
                </li>
              </ul>
            </div>
          </Col>
          <Col lg={4}></Col>
          <Col lg={4}>
            <h4 className="text-end">Get in touch</h4>
            <ul className="contact-info">
              <li>
                <p>
                  {address ? (
                    address
                  ) : (
                    <>
                      12A, Suhasini Ganguly Sarani,<br />
                      Kalighat (Near Harish Park)<br />
                      Kolkata - 700 025
                    </>
                  )}
                </p>
              </li>
              <li>
                <p>
                  <strong>Email us at:</strong><br />
                  <a href={`mailto:${email || META_DATA.email}`} className="text-white text-decoration-none">
                    {email || META_DATA.email}
                  </a>
                </p>
              </li>
            </ul>
          </Col>

          <Col lg={6}>
            <p className="copyright">{currentYear} © {META_DATA.description}</p>
          </Col>
          <Col lg={6}>
            <p className="copyright text-end">Site Designed by {META_DATA.author}</p>
          </Col>


          {/* <Col lg={3}>
            <Image src={logo} alt="logo" height={24} />
            <p className="mt-3 fs-sm">
              UBold is a best-selling admin dashboard template on ThemeForest,
              recognized for its clean design, versatility, and robust features.
              Create modern, responsive web applications effortlessly with this
              top-tier solution!
            </p>
            <div className="d-flex gap-2 mt-4 mb-2">
              {socialLinks.map((link, idx) => (
                <Link
                  href={link.url}
                  className="btn btn-sm btn-icon rounded-circle btn-dark"
                  title={link.title}
                  key={idx}
                >
                  <IconifyIcon icon={link.icon} className="fs-sm" />
                </Link>
              ))}
            </div>
          </Col>
          <Col lg={8} xxl={7}>
            <Row className="g-4">
              {footerLinks.map((section, index) => (
                <Col key={index} xs={6} md={4}>
                  <h5 className="text-white mb-4 ps-2">{section.title}</h5>
                  <ul className="nav flex-column">
                    {section.links.map((link, i) => (
                      <li className="nav-item" key={i}>
                        <Link
                          href={link.url}
                          className={`nav-link ${i === 0 && "pt-0"}`}
                        >
                          {link.name}
                          {link.badge && (
                            <span
                              className={`ms-2 badge text-bg-${link.badge.variant}`}
                            >
                              {link.badge.title}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Col>
              ))}
            </Row>
          </Col> */}
        </Row>
        {/* <Row className="mt-5">
          <Col xs={12} className="text-center">
            <p className="mb-4">
              © {currentYear} <span className="fw-semibold">DTech System</span>
            </p>
          </Col>
        </Row> */}
      </Container>
    </footer >
  );
};

export default Footer;
