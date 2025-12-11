import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Linkedin, Twitter } from "lucide-react";

function StackedCircularFooter() {
  return (
    <footer className="bg-background py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center">
          <div className="mb-8 rounded-full bg-primary/10 p-8">
            <Icons.logo className="icon-class w-6" />
          </div>
          <nav className="mb-8 flex flex-wrap justify-center gap-6">
            <a href="/" className="hover:text-primary">
              Home
            </a>
            <a href="#features" className="hover:text-primary">
              Features
            </a>
            <a href="/create-link" className="hover:text-primary">
              Create Link
            </a>
            <a
              href="https://docs.etherlinks.com"
              className="hover:text-primary"
            >
              Docs
            </a>
            <a href="#" className="hover:text-primary">
              Contact
            </a>
          </nav>
          <div className="mb-8 flex space-x-4">
            <Button variant="outline" size="icon" className="rounded-full">
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Twitter</span>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Instagram className="h-4 w-4" />
              <span className="sr-only">Instagram</span>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Linkedin className="h-4 w-4" />
              <span className="sr-only">LinkedIn</span>
            </Button>
          </div>
          <div className="mb-8 w-full max-w-md">
            <form className="flex space-x-2">
              <div className="flex-grow">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="Subscribe to updates"
                  type="email"
                  className="rounded-full"
                />
              </div>
              <Button type="submit" className="rounded-full">
                Subscribe
              </Button>
            </form>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 EtherBlinks. Built on Etherlink. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { StackedCircularFooter };
