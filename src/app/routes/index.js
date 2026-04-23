import express from "express";

// ESM সিস্টেমে অবশ্যই .js এক্সটেনশন দিতে হবে
import  AuthRoutes  from "../module/auth/auth.routes.js";
// import { AdminRoutes } from "../module/admin/admin.routes.js";
// import { SuperAdminRoutes } from "../module/superAdmin/superAdmin.routes.js";
import  UserRoutes  from "../module/user/user.routes.js";
import PostRoutes from "../module/post/post.routes.js";
// import { CurriculumRoutes } from "../module/curriculum/curriculum.routes.js";
// import { StudentRoutes } from "../module/student/student.routes.js";
// import { TeacherRoutes } from "../module/teacher/teacher.routes.js";
// import { NotificationRoutes } from "../module/notification/notification.routes.js";
// import { ManageRoutes } from "../module/manage/manage.routes.js";
// import { ClassRoutes } from "../module/class/class.routes.js";
// import { FeedbackRoutes } from "../module/feedback/feedback.routes.js";
// import { ReviewRoutes } from "../module/review/review.routes.js";
// import { PostRoutes } from "../module/post/post.routes.js";
// import { SubscriptionPlanRoutes } from "../module/subscriptionPlan/subscriptionPlan.routes.js";
// import { PaymentRoutes } from "../module/payment/payment.routes.js";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/user", route: UserRoutes },
  { path: "/post", route: PostRoutes },
  // { path: "/student", route: StudentRoutes },
  // { path: "/admin", route: AdminRoutes },
  // { path: "/super-admin", route: SuperAdminRoutes },
  // { path: "/manage", route: ManageRoutes },
  // { path: "/curriculum", route: CurriculumRoutes },
  // { path: "/teacher", route: TeacherRoutes },
  // { path: "/class", route: ClassRoutes },
  // { path: "/notification", route: NotificationRoutes },
  // { path: "/feedback", route: FeedbackRoutes },
  // { path: "/review", route: ReviewRoutes },
  // { path: "/post", route: PostRoutes },
  // { path: "/subscription-plan", route: SubscriptionPlanRoutes },
  // { path: "/payment", route: PaymentRoutes },
];

// Loop through the routes and mount them
moduleRoutes.forEach((route) => router.use(route.path, route.route));

// Elite Standard: Exporting the router as default
export default router;