import type { TaskType } from "@/lib/schemas";

export interface DraftTemplate {
  id: string;
  label: string;
  task_type: TaskType;
  /** Shown as placeholder in the Recipient context field after selection. */
  recipient_context_hint: string;
  /** Pre-fills the objective textarea — staff edits the [brackets]. */
  objective: string;
  /** Pre-fills additional notes (optional). */
  additional_notes: string;
}

export const DEFAULT_TEMPLATES: DraftTemplate[] = [
  {
    id: "booking_confirmation",
    label: "Booking Confirmation",
    task_type: "guest_email",
    recipient_context_hint: "e.g. Mr. Smith — Deluxe Room — 3 nights",
    objective: "ยืนยันการจองห้อง [ประเภทห้อง] check-in [วันที่] check-out [วันที่] ราคารวม [จำนวนเงิน] บาท",
    additional_notes: "",
  },
  {
    id: "vip_arrival",
    label: "VIP Arrival Welcome",
    task_type: "guest_email",
    recipient_context_hint: "e.g. Ms. Chen — VIP Gold — returning guest",
    objective: "ต้อนรับลูกค้า VIP ที่จะเดินทางมาถึงในวันพรุ่งนี้ แจ้งว่าทีมงานพร้อมดูแลและมีของต้อนรับพิเศษรออยู่ในห้อง",
    additional_notes: "mention complimentary fruit basket and personalised welcome note",
  },
  {
    id: "post_stay_thanks",
    label: "Post-Stay Thank You",
    task_type: "guest_email",
    recipient_context_hint: "e.g. Dr. Patel — just checked out — stayed 5 nights",
    objective: "ขอบคุณลูกค้าที่เลือกพักที่โรงแรม เพิ่งทำการ check-out ไปแล้ว ขอเชิญกลับมาพักอีกครั้งในโอกาสหน้า",
    additional_notes: "",
  },
  {
    id: "apology_service",
    label: "Apology & Service Recovery",
    task_type: "apology_recovery",
    recipient_context_hint: "e.g. Mr. Johnson — complained about noise — Suite 502",
    objective: "ขอโทษลูกค้าสำหรับปัญหา [ระบุปัญหาที่เกิดขึ้น] ระหว่างการพัก และแจ้งว่าเราได้แก้ไขปัญหาเรียบร้อยแล้ว",
    additional_notes: "offer complimentary [dinner / room upgrade / spa] as goodwill gesture",
  },
  {
    id: "upgrade_offer",
    label: "Room Upgrade Offer",
    task_type: "upsell_offer",
    recipient_context_hint: "e.g. Ms. Davis — booked Deluxe — arriving tomorrow",
    objective: "เสนอ upgrade ห้องจาก [ประเภทห้องปัจจุบัน] เป็น [ประเภทห้องที่ดีกว่า] ในราคาพิเศษ [ราคา] บาทต่อคืน",
    additional_notes: "mention the view, extra space, or special amenities of the upgraded room",
  },
  {
    id: "anniversary_package",
    label: "Anniversary / Special Occasion",
    task_type: "upsell_offer",
    recipient_context_hint: "e.g. Mr. & Mrs. Lee — 5th anniversary — Honeymoon Suite",
    objective: "เสนอ special package สำหรับการ celebrate [ชื่อโอกาสพิเศษ] ประกอบด้วย [รายการใน package] ราคา [จำนวนเงิน] บาท",
    additional_notes: "mention flower arrangement, cake, and couples spa discount",
  },
  {
    id: "late_checkout",
    label: "Late Check-out Approval",
    task_type: "guest_email",
    recipient_context_hint: "e.g. Mr. Brown — Room 301 — checkout tomorrow",
    objective: "แจ้งลูกค้าว่าคำขอ late check-out ได้รับการอนุมัติ สามารถ check-out ได้ถึงเวลา [เวลา] น.",
    additional_notes: "remind about luggage storage available after checkout if needed",
  },
  {
    id: "corporate_proposal",
    label: "Corporate Rate Proposal",
    task_type: "corporate_partner",
    recipient_context_hint: "e.g. HR Manager — TechCorp Ltd — ~50 room nights/year",
    objective: "เสนอ corporate rate agreement สำหรับ [ชื่อบริษัท] อัตราพิเศษ [ราคา] บาท/คืน รวมสิทธิ์ [ระบุสิทธิ์]",
    additional_notes: "mention F&B discount, meeting room access, and priority booking",
  },
];

/** Task type → human label for the filter tabs in the template modal. */
export const TASK_LABELS: Record<string, string> = {
  guest_email:      "Guest Email",
  upsell_offer:     "Upsell / Offer",
  apology_recovery: "Apology",
  corporate_partner: "Corporate",
  internal_memo:    "Internal",
};
