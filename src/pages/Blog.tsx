import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const POSTS = [
  { title: "5 Tips to Land Your First Tech Internship", excerpt: "Breaking into tech can feel overwhelming. Here's how to stand out from the crowd and get noticed by top companies.", date: "Feb 28, 2026", category: "Career Tips" },
  { title: "Why Skills-Based Hiring Is the Future", excerpt: "Traditional resumes are losing relevance. Learn how skills-based matching is transforming the way companies find talent.", date: "Feb 20, 2026", category: "Industry" },
  { title: "How to Build a Portfolio That Gets Interviews", excerpt: "Your portfolio is your most powerful tool. We break down what hiring managers actually look for.", date: "Feb 12, 2026", category: "Career Tips" },
  { title: "Remote Internships: What to Expect in 2026", excerpt: "Remote work is here to stay. Here's how to thrive in a virtual internship and make a lasting impression.", date: "Feb 5, 2026", category: "Trends" },
  { title: "Wroobe Platform Update: Match Scores 2.0", excerpt: "We've upgraded our matching algorithm to better surface opportunities tailored to your unique skill set.", date: "Jan 28, 2026", category: "Product" },
  { title: "From Intern to Full-Time: Success Stories", excerpt: "Real stories from students who turned their Wroobe internships into full-time offers.", date: "Jan 15, 2026", category: "Stories" },
];

const Blog = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="py-20">
      <div className="container">
        <motion.div className="mx-auto max-w-2xl text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Blog</h1>
          <p className="mt-4 text-lg text-muted-foreground">Career insights, platform updates, and industry trends.</p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6">
          {POSTS.map((post, i) => (
            <motion.article
              key={i}
              className="group card-depth p-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">{post.category}</span>
                  <h2 className="mt-1 font-display text-lg font-semibold group-hover:text-primary transition-colors">{post.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {post.date}
                  </div>
                </div>
                <ArrowRight className="mt-6 h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary" />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default Blog;
