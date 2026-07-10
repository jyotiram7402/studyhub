"use client";

import { useState } from "react";
import { Check, Copy, Linkedin, MessageCircle, QrCode, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonProps {
  title: string;
  path: string;
}

export function ShareButton({ title, path }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  function shareUrl(): string {
    return `${window.location.origin}${path}`;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl());
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function openShare(buildUrl: (url: string, text: string) => string) {
    const url = buildUrl(encodeURIComponent(shareUrl()), encodeURIComponent(title));
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  return (
    <DropdownMenu onOpenChange={(open) => !open && setShowQr(false)}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Share">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Share this note</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={copyLink}>
          {copied ? <Check /> : <Copy />}
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => openShare((url, text) => `https://wa.me/?text=${text}%20${url}`)}
        >
          <MessageCircle />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            openShare((url) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}`)
          }
        >
          <Linkedin />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            openShare((url, text) => `https://twitter.com/intent/tweet?text=${text}&url=${url}`)
          }
        >
          <Twitter />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            setShowQr((current) => !current);
          }}
        >
          <QrCode />
          {showQr ? "Hide QR code" : "Show QR code"}
        </DropdownMenuItem>
        {showQr && (
          <div className="flex justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl())}`}
              alt={`QR code linking to ${title}`}
              width={160}
              height={160}
              loading="lazy"
              className="rounded-md border bg-white p-1"
            />
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
