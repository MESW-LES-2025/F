export default function TermsAndConditionsModal({
  open,
  onClose,
  tab,
  setTab,
}: {
  open: boolean;
  onClose: () => void;
  tab: "terms" | "privacy";
  setTab: (t: "terms" | "privacy") => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-lg w-full">
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${
              tab === "terms" ? "border-b-2 border-primary" : "text-gray-500"
            }`}
            onClick={() => setTab("terms")}
          >
            Terms of Service
          </button>

          <button
            className={`px-4 py-2 ${
              tab === "privacy" ? "border-b-2 border-primary" : "text-gray-500"
            }`}
            onClick={() => setTab("privacy")}
          >
            Privacy Policy
          </button>
        </div>

        <div className="text-sm max-h-80 overflow-y-auto pr-2">
          {tab === "terms" && (
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                <strong>Last updated:</strong> 24/11/2025
              </p>

              <p>
                These Terms of Service describe the basic rules for using this
                sample website or application. This document is intended only
                for educational purposes and does not represent a legally
                binding agreement.
              </p>

              <h3 className="text-base font-semibold mt-4">
                1. Acceptance of Terms
              </h3>
              <p>
                By accessing or using this website or application, you agree to
                these Terms of Service. If you do not agree, you should
                discontinue use.
              </p>

              <h3 className="text-base font-semibold mt-4">
                2. Use of the Service
              </h3>
              <p>
                You may use this service only for personal and non-commercial
                purposes. You agree not to misuse the platform or attempt
                unauthorized access.
              </p>

              <h3 className="text-base font-semibold mt-4">3. User Content</h3>
              <p>
                Any content submitted by you remains your responsibility. You
                agree not to submit harmful, offensive, or unlawful material.
              </p>

              <h3 className="text-base font-semibold mt-4">4. Privacy</h3>
              <p>
                This service may collect basic usage information for
                demonstration only. No real personal data is stored or shared.
              </p>

              <h3 className="text-base font-semibold mt-4">
                5. Availability and Changes
              </h3>
              <p>
                The service may be modified, interrupted, or removed at any time
                without notice and without guarantee of continued operation.
              </p>

              <h3 className="text-base font-semibold mt-4">6. Disclaimer</h3>
              <p>
                This platform is provided “as is” without warranties of any
                kind. The creators are not responsible for errors or issues that
                may occur.
              </p>

              <h3 className="text-base font-semibold mt-4">
                7. Limitation of Liability
              </h3>
              <p>
                To the maximum extent allowed for academic examples, the
                creators are not liable for any damages resulting from use of
                this service.
              </p>

              <h3 className="text-base font-semibold mt-4">8. Governing Law</h3>
              <p>
                Since this is an educational demo, no real legal jurisdiction
                applies. This section is included for structure only.
              </p>

              <h3 className="text-base font-semibold mt-4">9. Contact</h3>
              <p>
                For questions regarding this academic demonstration, please
                contact the project author or instructor.
              </p>
            </div>
          )}

          {tab === "privacy" && (
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                <strong>Last updated:</strong> 24/11/2025
              </p>

              <p>
                This Privacy Policy explains how basic information may be
                handled in this sample project. It is intended solely for
                educational purposes and does not represent a real or legally
                binding privacy policy.
              </p>

              <h3 className="text-base font-semibold mt-4">
                1. Information Collection
              </h3>
              <p>
                This project may collect simple usage data, such as page
                interactions, for demonstration. No actual personal information
                is required or stored.
              </p>

              <h3 className="text-base font-semibold mt-4">
                2. Use of Information
              </h3>
              <p>
                Any information collected is used only to illustrate how a
                system might function in an academic context.
              </p>

              <h3 className="text-base font-semibold mt-4">3. Cookies</h3>
              <p>
                This project may simulate cookie usage, but no real tracking,
                analytics, or advertising technologies are implemented.
              </p>

              <h3 className="text-base font-semibold mt-4">4. Data Sharing</h3>
              <p>
                No information is sold, shared, or transferred to third parties,
                as this is a fictional educational system.
              </p>

              <h3 className="text-base font-semibold mt-4">5. Data Storage</h3>
              <p>
                No personal data is permanently stored. Any temporary
                information is used only for demonstration and is not retained.
              </p>

              <h3 className="text-base font-semibold mt-4">6. Security</h3>
              <p>
                Since no real user data is collected, security measures are
                minimal and only conceptual.
              </p>

              <h3 className="text-base font-semibold mt-4">
                7. Children's Privacy
              </h3>
              <p>
                This project is not intended for real users, including children.
                No age verification or protections are required.
              </p>

              <h3 className="text-base font-semibold mt-4">
                8. Changes to This Policy
              </h3>
              <p>
                This Privacy Policy may be updated for educational enhancement
                without notice.
              </p>

              <h3 className="text-base font-semibold mt-4">9. Contact</h3>
              <p>
                For academic purposes, questions may be directed to the creator
                or course instructor.
              </p>
            </div>
          )}
        </div>

        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
