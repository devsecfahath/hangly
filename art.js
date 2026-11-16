(() => {
  "use strict";
  const NS = globalThis.LittleHang;
  function face(ctx, y = 7) {
    ctx.fillStyle = "#443b36";
    for (const x of [-12, 12]) { ctx.beginPath(); ctx.ellipse(x, y, 2.4, 3.1, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.lineWidth = 1.8; ctx.strokeStyle = "#443b36"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(0, y + 3, 5, 0.25, Math.PI - 0.25); ctx.stroke();
    ctx.fillStyle = "#e89b8b88";
    for (const x of [-21, 21]) { ctx.beginPath(); ctx.ellipse(x, y + 7, 5, 2.8, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  function drawCharm(ctx, id, size, imageCanvas, effect = {}) {
    ctx.save(); ctx.scale(size / 100, size / 100);
    ctx.shadowColor = "#3e30252b"; ctx.shadowBlur = 9; ctx.shadowOffsetY = 6;
    ctx.lineJoin = "round"; ctx.lineWidth = 2.5;
    if (id === "custom" && imageCanvas) {
      const scale = 88 / Math.max(imageCanvas.width, imageCanvas.height);
      ctx.drawImage(imageCanvas, -imageCanvas.width * scale / 2, -imageCanvas.height * scale / 2,
        imageCanvas.width * scale, imageCanvas.height * scale);
    } else if (id === "star" || id === "custom") {
      const fill = ctx.createLinearGradient(-30, -45, 25, 42); fill.addColorStop(0, "#ffe7a2"); fill.addColorStop(1, "#eeb54b");
      ctx.fillStyle = fill; ctx.strokeStyle = "#cf983c"; ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 23 : 46, a = i * Math.PI / 5 - Math.PI / 2;
        if (!i) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill(); ctx.shadowColor = "transparent"; ctx.stroke(); face(ctx, 0);
    } else if (id === "moon") {
      ctx.fillStyle = "#b8b4df"; ctx.strokeStyle = "#8a84b4"; ctx.beginPath();
      ctx.moveTo(18, -42); ctx.bezierCurveTo(-52, -48, -57, 40, 9, 44);
      ctx.bezierCurveTo(28, 46, 40, 35, 43, 25); ctx.bezierCurveTo(-4, 38, -23, -15, 18, -42);
      ctx.closePath(); ctx.fill(); ctx.shadowColor = "transparent"; ctx.stroke();
      ctx.save(); ctx.translate(-17, 3); ctx.scale(0.66, 0.66); face(ctx); ctx.restore();
    } else if (id === "sprout") {
      // A planter hanger carries the pot, with the foliage painted in front.
      ctx.save(); ctx.shadowColor = "transparent"; ctx.lineCap = "round";
      const rope = effect.rope || "thread";
      ctx.strokeStyle = rope === "chain" ? "#a9b6bd" : rope === "neon" ? "#ddffe7" : "#bd9870";
      ctx.lineWidth = rope === "chain" ? 1.8 : 1.5;
      if (rope === "chain") ctx.setLineDash([1.2, 1.6]);
      if (rope === "neon") { ctx.shadowColor = "#64ed94"; ctx.shadowBlur = 7; }
      ctx.beginPath(); ctx.moveTo(-24, 15); ctx.lineTo(0, -40); ctx.lineTo(24, 15); ctx.stroke();
      ctx.setLineDash([]); ctx.shadowColor = "transparent";
      const steel = ctx.createLinearGradient(-4, -48, 4, -40);
      steel.addColorStop(0, "#e6eef1"); steel.addColorStop(0.55, "#8298a7"); steel.addColorStop(1, "#b6c6cf");
      ctx.strokeStyle = steel; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.ellipse(0, -44, 3.4, 4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = "#597554"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 32); ctx.quadraticCurveTo(3, 1, 0, -22); ctx.stroke();
      ctx.fillStyle = "#8bb57c"; ctx.beginPath(); ctx.moveTo(0, 2); ctx.bezierCurveTo(-42, 7, -48, -28, -36, -39);
      ctx.bezierCurveTo(-9, -37, 0, -21, 0, 2); ctx.fill();
      ctx.fillStyle = "#abc893"; ctx.beginPath(); ctx.moveTo(1, -9); ctx.bezierCurveTo(3, -43, 27, -48, 42, -40);
      ctx.bezierCurveTo(44, -14, 21, -2, 1, -9); ctx.fill(); ctx.shadowColor = "transparent";
      ctx.fillStyle = "#d4a57a"; ctx.strokeStyle = "#ad7b55"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-24, 14); ctx.lineTo(24, 14); ctx.lineTo(18, 44); ctx.lineTo(-18, 44); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(0, 21); ctx.scale(0.63, 0.63); face(ctx, 0); ctx.restore();
    } else if (id === "ghost") {
      ctx.fillStyle = "#fffdf6"; ctx.strokeStyle = "#d8d2c5"; ctx.beginPath();
      ctx.moveTo(-35, 38); ctx.lineTo(-35, -6); ctx.bezierCurveTo(-35, -56, 35, -56, 35, -6); ctx.lineTo(35, 38);
      ctx.quadraticCurveTo(22, 20, 12, 38); ctx.quadraticCurveTo(0, 20, -12, 38); ctx.quadraticCurveTo(-24, 20, -35, 38);
      ctx.closePath(); ctx.fill(); ctx.shadowColor = "transparent"; ctx.stroke(); face(ctx, -2);
    } else if (id === "spiderman-full") {
      // A compact upside-down figure: boots at the cord, mask below the shoulders.
      ctx.shadowColor = "transparent"; ctx.lineCap = "round"; ctx.lineJoin = "round";
      const limb = (points, color, width) => {
        ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
        for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
        ctx.strokeStyle = "#293347"; ctx.lineWidth = width + 2.5; ctx.stroke();
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
      };
      for (const side of [-1, 1]) {
        limb([[side * 5, -9], [side * 18, -25], [side * 5, -43]], "#3565a4", 10);
        limb([[side * 15, -29], [side * 5, -43]], "#df3d46", 9);
        limb([[side * 8, 4], [side * 24, -1], [side * 27, -19]], "#3565a4", 8);
        limb([[side * 25, -9], [side * 27, -20]], "#e94447", 8);
        ctx.fillStyle = "#ff7770";
        ctx.beginPath(); ctx.arc(side * 27, -21, 3.1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#76273588"; ctx.lineWidth = 0.9;
        for (const y of [-34, -38]) {
          const x = side * (y === -34 ? 11 : 8);
          ctx.beginPath(); ctx.moveTo(x - 3, y - 1); ctx.lineTo(x + 3, y + 1); ctx.stroke();
        }
      }
      ctx.fillStyle = "#32619f"; ctx.strokeStyle = "#293347"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-7, -15); ctx.lineTo(7, -15);
      ctx.bezierCurveTo(9, -10, 10, -3, 12, 5); ctx.lineTo(5, 15);
      ctx.lineTo(-5, 15); ctx.lineTo(-12, 5); ctx.bezierCurveTo(-10, -3, -9, -10, -7, -15);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      const suit = ctx.createLinearGradient(-10, -8, 10, 14);
      suit.addColorStop(0, "#ff7770"); suit.addColorStop(1, "#d82f41");
      ctx.fillStyle = suit;
      ctx.beginPath(); ctx.moveTo(-7, -12); ctx.lineTo(7, -12); ctx.lineTo(6, -3);
      ctx.lineTo(11, 3); ctx.lineTo(4, 15); ctx.lineTo(-4, 15); ctx.lineTo(-11, 3); ctx.lineTo(-6, -3);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#76273588"; ctx.lineWidth = 0.7;
      for (const y of [-8, -3, 3, 9]) {
        ctx.beginPath(); ctx.moveTo(-7, y); ctx.quadraticCurveTo(0, y + 3, 7, y); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 15); ctx.stroke();
      ctx.strokeStyle = "#252c3b"; ctx.lineWidth = 1; ctx.fillStyle = "#252c3b";
      ctx.beginPath(); ctx.ellipse(0, 2, 1.5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.moveTo(side, i - 0.5);
          ctx.lineTo(side * 4, i * 2 - 4); ctx.lineTo(side * 5.5, i * 3 - 6); ctx.stroke();
        }
      }
      ctx.save(); ctx.translate(0, 25); ctx.rotate(Math.PI);
      drawCharm(ctx, "spiderman", 44); ctx.restore();
      ctx.strokeStyle = "#d1d8df"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-7, -44); ctx.lineTo(7, -41); ctx.moveTo(-6, -41); ctx.lineTo(6, -44); ctx.stroke();
    } else if (id === "spiderman") {
      const mask = new Path2D();
      mask.moveTo(0, -44);
      mask.bezierCurveTo(-28, -44, -39, -26, -36, -3);
      mask.bezierCurveTo(-35, 20, -19, 43, 0, 46);
      mask.bezierCurveTo(19, 43, 35, 20, 36, -3);
      mask.bezierCurveTo(39, -26, 28, -44, 0, -44);
      mask.closePath();
      const fill = ctx.createLinearGradient(-30, -40, 28, 40);
      fill.addColorStop(0, "#ff7770"); fill.addColorStop(0.45, "#e94447"); fill.addColorStop(1, "#b92336");
      ctx.fillStyle = fill; ctx.fill(mask); ctx.shadowColor = "transparent";
      ctx.save(); ctx.clip(mask);
      ctx.strokeStyle = "#55273588"; ctx.lineWidth = 1.25;
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(Math.cos(a) * 90, -7 + Math.sin(a) * 90); ctx.stroke();
      }
      for (const radius of [12, 24, 36, 49, 63]) {
        ctx.beginPath(); ctx.ellipse(0, -7, radius, radius * 1.15, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = "#8d2939"; ctx.lineWidth = 2.5; ctx.stroke(mask);
      for (const side of [-1, 1]) {
        ctx.save(); ctx.scale(side, 1);
        const eye = ctx.createLinearGradient(10, -12, 26, 17);
        eye.addColorStop(0, "#ffffff"); eye.addColorStop(1, "#d9e7ec");
        ctx.fillStyle = eye; ctx.strokeStyle = "#292e3b"; ctx.lineWidth = 3.8;
        ctx.beginPath(); ctx.moveTo(30, -13);
        ctx.bezierCurveTo(23, -9, 14, -6, 7, 4);
        ctx.bezierCurveTo(6, 12, 12, 17, 20, 13);
        ctx.bezierCurveTo(28, 10, 31, -1, 30, -13);
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      ctx.strokeStyle = "#fff7f33d"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-24, -26); ctx.quadraticCurveTo(-17, -36, -7, -37); ctx.stroke();
    } else if (id === "thor-hammer") {
      const time = effect.time || 0;
      const pulse = effect.animated ? 0.5 + 0.5 * Math.sin(time * 2.4) : 0.4;
      const drift = effect.animated ? Math.sin(time * 3.2) * 2.2 : 0;
      ctx.shadowColor = "transparent";
      const halo = ctx.createRadialGradient(0, -19, 5, 0, -19, 45);
      halo.addColorStop(0, "rgba(89,194,255," + (0.12 + pulse * 0.12) + ")");
      halo.addColorStop(1, "rgba(89,194,255,0)");
      ctx.fillStyle = halo; ctx.fillRect(-46, -54, 92, 82);

      // Steel collar, wrapped leather grip, and the wrist strap.
      const leather = ctx.createLinearGradient(-5, 0, 6, 0);
      leather.addColorStop(0, "#b67c50"); leather.addColorStop(0.5, "#69422f"); leather.addColorStop(1, "#a26943");
      ctx.fillStyle = leather; ctx.strokeStyle = "#493a34"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.roundRect(-4.5, 0, 9, 40, 2); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.rect(-4.5, 6, 9, 32); ctx.clip();
      ctx.strokeStyle = "#d4a477"; ctx.lineWidth = 1.1;
      for (let y = 7; y < 41; y += 5) {
        ctx.beginPath(); ctx.moveTo(-5, y); ctx.lineTo(5, y + 4); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = "#d2dce4"; ctx.fillRect(-6, 3, 12, 5); ctx.fillRect(-5.5, 36, 11, 4);
      ctx.strokeStyle = "#79573f"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.ellipse(1, 43, 6, 4, -0.25, 0, Math.PI * 2); ctx.stroke();

      // Beveled head, with separate top, front, and side surfaces.
      ctx.lineWidth = 1.6; ctx.strokeStyle = "#4c5e70";
      ctx.fillStyle = "#dce5eb"; ctx.beginPath();
      ctx.moveTo(-31, -29); ctx.lineTo(-23, -37); ctx.lineTo(33, -37); ctx.lineTo(25, -29);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      const side = ctx.createLinearGradient(25, -30, 34, 0);
      side.addColorStop(0, "#9aafc1"); side.addColorStop(1, "#475e75");
      ctx.fillStyle = side; ctx.beginPath();
      ctx.moveTo(25, -29); ctx.lineTo(33, -37); ctx.lineTo(33, -6); ctx.lineTo(25, 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      const steel = ctx.createLinearGradient(-28, -28, 22, 4);
      steel.addColorStop(0, "#f0f3f5"); steel.addColorStop(0.36, "#b9c8d3");
      steel.addColorStop(0.7, "#8b9fb0"); steel.addColorStop(1, "#62778e");
      ctx.fillStyle = steel; ctx.beginPath(); ctx.roundRect(-31, -29, 56, 31, 2.5);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#eaf4f9"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-27, -25); ctx.lineTo(21, -25); ctx.moveTo(-27, -25); ctx.lineTo(-27, -2); ctx.stroke();
      ctx.strokeStyle = "#657d92"; ctx.strokeRect(-24, -23, 42, 18);
      ctx.strokeStyle = "#eef6fa88"; ctx.lineWidth = 0.7;
      for (const y of [-33, -31]) { ctx.beginPath(); ctx.moveTo(-19, y); ctx.lineTo(24, y); ctx.stroke(); }

      // The small mounting loop meets the simulated rope above the head.
      ctx.strokeStyle = "#65798d"; ctx.lineWidth = 2.3;
      ctx.beginPath(); ctx.ellipse(0, -41, 4, 5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "#dcecf6"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(-0.5, -42, 2.5, Math.PI, Math.PI * 1.85); ctx.stroke();

      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.shadowColor = "#56caff"; ctx.shadowBlur = 4 + pulse * 7;
      ctx.strokeStyle = "rgba(177,235,255," + (0.65 + pulse * 0.3) + ")"; ctx.lineWidth = 1.1;
      for (const x of [-16, -3, 10]) {
        ctx.beginPath(); ctx.moveTo(x, -20); ctx.lineTo(x, -8);
        ctx.moveTo(x, -19); ctx.lineTo(x + 5, -15); ctx.lineTo(x, -12);
        ctx.moveTo(x, -15); ctx.lineTo(x - 4, -11); ctx.stroke();
      }
      ctx.globalAlpha = 0.22 + pulse * 0.6;
      ctx.lineWidth = 1.3;
      const bolts = [
        [[-30, -23], [-39, -27 + drift], [-35, -17], [-44, -14 + drift], [-39, -6]],
        [[32, -29], [41, -34 - drift], [37, -23], [45, -19 + drift], [39, -10]],
        [[-11, -36], [-17 + drift, -44], [-8, -43], [-4, -49]]
      ];
      for (const points of bolts) {
        ctx.beginPath(); ctx.moveTo(...points[0]);
        for (const point of points.slice(1)) ctx.lineTo(...point);
        ctx.stroke();
      }
      ctx.restore();
    } else if (id === "captain-shield") {
      // A steel rim, enamel rings, and a raised silver star.
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#6b7c8c"; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(0, -44, 4.2, 4.5, 0, 0, Math.PI * 2); ctx.stroke();
      const metal = ctx.createLinearGradient(-34, -36, 34, 38);
      metal.addColorStop(0, "#f3f7fa"); metal.addColorStop(0.35, "#aabac7");
      metal.addColorStop(0.7, "#5d7286"); metal.addColorStop(1, "#dce6ec");
      ctx.fillStyle = metal; ctx.shadowColor = "#152c493d"; ctx.shadowBlur = 7; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fill(); ctx.shadowColor = "transparent";
      const red = ctx.createLinearGradient(-25, -36, 24, 35);
      red.addColorStop(0, "#fa6a66"); red.addColorStop(0.4, "#d62f3c"); red.addColorStop(1, "#8e142c");
      const silver = ctx.createLinearGradient(-22, -30, 24, 29);
      silver.addColorStop(0, "#ffffff"); silver.addColorStop(0.5, "#d7e0e7"); silver.addColorStop(1, "#93a7b8");
      const blue = ctx.createRadialGradient(-6, -9, 1, 0, 0, 23);
      blue.addColorStop(0, "#4282c8"); blue.addColorStop(1, "#173e76");
      for (const [radius, fill] of [[42, red], [33.5, silver], [25.3, red], [17.5, blue]]) {
        ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#243d552b"; ctx.lineWidth = 0.65; ctx.stroke();
      }
      ctx.strokeStyle = "#f7fbff22"; ctx.lineWidth = 0.5;
      for (let radius = 19; radius < 42; radius += 2.4) {
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = silver; ctx.strokeStyle = "#d5e5f5"; ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 ? 6.2 : 14.8, angle = i * Math.PI / 5 - Math.PI / 2;
        const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#ffffff9c"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(0, 0, 40, Math.PI * 1.08, Math.PI * 1.72); ctx.stroke();
      ctx.strokeStyle = "#142d4c44"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, 40, Math.PI * 0.03, Math.PI * 0.65); ctx.stroke();
    } else if (id === "madara") {
      ctx.shadowColor = "transparent"; ctx.lineJoin = "round"; ctx.lineCap = "round";
      const polygon = (points, fill, edge = "#202634", width = 1.3) => {
        ctx.fillStyle = fill; ctx.strokeStyle = edge; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(...points[0]);
        for (const point of points.slice(1)) ctx.lineTo(...point);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      };
      // Susanoo forms a translucent guardian behind the smaller foreground figure.
      const chakraTime = effect.time || 0;
      const chakraPulse = effect.animated ? 0.5 + 0.5 * Math.sin(chakraTime * 1.7) : 0.5;
      ctx.save();
      const aura = ctx.createRadialGradient(0,-10,7,0,-10,51);
      aura.addColorStop(0,"rgba(83,162,255," + (0.12 + chakraPulse * 0.07) + ")");
      aura.addColorStop(1,"rgba(83,162,255,0)");
      ctx.fillStyle = aura; ctx.fillRect(-51,-55,102,106);
      ctx.shadowColor = "#6ab9ff"; ctx.shadowBlur = 4 + chakraPulse * 4;
      const shell = "rgba(67,128,219,0.22)", edge = "rgba(133,204,255," + (0.55 + chakraPulse * 0.25) + ")";
      polygon([[-24,-19],[-34,-16],[-45,-6],[-40,12],[-31,7],[-28,30],[-18,40],
        [18,40],[28,30],[31,7],[40,12],[45,-6],[34,-16],[24,-19]], shell, edge, 1.6);
      for (const side of [-1,1]) {
        ctx.save(); ctx.scale(side,1);
        polygon([[22,-18],[35,-23],[45,-12],[35,-11],[29,-1],[23,-5]], "rgba(94,150,235,0.25)", edge, 1.3);
        polygon([[33,9],[42,14],[39,33],[32,38],[28,28]], "rgba(76,130,214,0.20)", edge, 1.1);
        ctx.strokeStyle = edge; ctx.lineWidth = 1.7;
        for (let y=-2;y<30;y+=8) {
          ctx.beginPath(); ctx.moveTo(29,y); ctx.bezierCurveTo(25,y+6,18,y+7,7,y+5); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(25,-13); ctx.lineTo(17,0); ctx.lineTo(15,31); ctx.stroke();
        ctx.restore();
      }
      polygon([[-14,-43],[-23,-50],[-19,-35],[-24,-29],[-17,-19],[-9,-13],
        [9,-13],[17,-19],[24,-29],[19,-35],[23,-50],[14,-43],[7,-47],[-7,-47]],
        "rgba(72,126,213,0.34)", edge, 1.7);
      ctx.strokeStyle = "#b5e7ff"; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-14,-36); ctx.lineTo(-6,-40); ctx.lineTo(0,-36);
      ctx.lineTo(6,-40); ctx.lineTo(14,-36); ctx.moveTo(0,-36); ctx.lineTo(0,-22); ctx.stroke();
      ctx.fillStyle = "#d3faff"; ctx.shadowColor = "#8fd8ff"; ctx.shadowBlur = 7 + chakraPulse * 4;
      for (const side of [-1,1]) {
        ctx.beginPath(); ctx.moveTo(side*4,-31); ctx.lineTo(side*15,-33);
        ctx.lineTo(side*11,-28); ctx.lineTo(side*5,-28); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = "#b8e7ff"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-9,-21); ctx.lineTo(-5,-18); ctx.lineTo(5,-18); ctx.lineTo(9,-21);
      ctx.moveTo(-4,-24); ctx.lineTo(0,-22); ctx.lineTo(4,-24); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(0,14); ctx.scale(0.7,0.7);
      // Long, uneven spikes behind the face and armor.
      polygon([[-7,-42],[-13,-49],[-17,-41],[-27,-45],[-24,-34],[-35,-35],[-28,-24],
        [-36,-23],[-27,-13],[-30,4],[-20,-1],[-24,18],[-13,12],[0,25],[12,11],
        [25,18],[22,1],[29,5],[27,-13],[34,-22],[26,-25],[31,-37],[19,-34],
        [19,-45],[7,-40],[1,-48]], "#252d3d");
      ctx.strokeStyle = "#3c475d"; ctx.lineWidth = 1;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(side * 17, -32); ctx.quadraticCurveTo(side * 25, -15, side * 18, 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(side * 8, -42); ctx.lineTo(side * 19, -27); ctx.stroke();
      }
      // Trousers, shin wraps, and open-toe sandals.
      ctx.fillStyle = "#303646"; ctx.strokeStyle = "#1c2432"; ctx.lineWidth = 1.4;
      for (const x of [-11, 3]) {
        ctx.beginPath(); ctx.roundRect(x, 22, 8.5, 21, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#b7bdc4"; ctx.fillRect(x + 0.6, 35, 7.3, 5);
        ctx.strokeStyle = "#6d7684"; ctx.lineWidth = 0.65;
        for (const y of [36.5, 38.5]) { ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x + 7, y + 1); ctx.stroke(); }
        ctx.fillStyle = "#d6b199"; ctx.beginPath(); ctx.roundRect(x - 0.5, 42, 10, 5, 2); ctx.fill();
        ctx.fillStyle = "#263343"; ctx.fillRect(x - 0.5, 41, 10, 2.5);
        ctx.fillStyle = "#303646"; ctx.strokeStyle = "#1c2432"; ctx.lineWidth = 1.4;
      }
      const armor = ctx.createLinearGradient(-15, -8, 18, 31);
      armor.addColorStop(0, "#c36b68"); armor.addColorStop(0.4, "#9b424a"); armor.addColorStop(1, "#682d3a");
      polygon([[-11,-9],[11,-9],[16,8],[12,27],[-12,27],[-16,8]], "#303746");
      polygon([[-13,-7],[13,-7],[12,14],[-12,14]], armor, "#612e3a");
      for (const side of [-1, 1]) {
        ctx.save(); ctx.scale(side, 1);
        polygon([[1,13],[13,12],[18,30],[4,29]], armor, "#612e3a");
        polygon([[12,-6],[23,-4],[24,7],[13,4]], armor, "#612e3a");
        ctx.strokeStyle = "#632e3b"; ctx.lineWidth = 1;
        for (const y of [18, 23]) { ctx.beginPath(); ctx.moveTo(3, y); ctx.lineTo(15, y + 1); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(14, -1); ctx.lineTo(23, 1); ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = "#632e3b"; ctx.lineWidth = 1.1;
      for (const y of [-2, 4, 10]) { ctx.beginPath(); ctx.moveTo(-11, y); ctx.lineTo(11, y); ctx.stroke(); }
      ctx.fillStyle = "#d48c7b";
      for (const x of [-9, 9]) for (const y of [-3, 3, 9]) { ctx.beginPath(); ctx.arc(x, y, 0.65, 0, Math.PI * 2); ctx.fill(); }
      // Folded arms and a compact hand-seal pose.
      for (const side of [-1, 1]) {
        ctx.strokeStyle = "#242c3a"; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(side * 19, 7); ctx.lineTo(side * 13, 14); ctx.lineTo(side * 3, 8); ctx.stroke();
        ctx.strokeStyle = "#bb8d79"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(side * 8, 11); ctx.lineTo(side * 2, 8); ctx.stroke();
      }
      ctx.fillStyle = "#dfb59d"; ctx.beginPath(); ctx.ellipse(0, 8, 4, 4.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#a67666"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-1, 4); ctx.lineTo(-1, 10); ctx.moveTo(1.3, 4); ctx.lineTo(1.3, 9); ctx.stroke();
      // Face framed by the heavy fringe; one red Sharingan eye remains visible.
      const skin = ctx.createLinearGradient(-9, -37, 12, -10);
      skin.addColorStop(0, "#f0d1b2"); skin.addColorStop(1, "#bc8e7b");
      ctx.fillStyle = skin; ctx.strokeStyle = "#805e57"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, -25, 14, 16.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#e6e2d9"; ctx.beginPath(); ctx.moveTo(2, -26); ctx.quadraticCurveTo(7, -30, 12, -27);
      ctx.quadraticCurveTo(8, -22, 3, -24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#b42a37"; ctx.beginPath(); ctx.arc(7.8, -26, 2.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#252635"; ctx.beginPath(); ctx.arc(7.8, -26, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#453540"; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(2, -29); ctx.lineTo(12, -30); ctx.moveTo(8, -22); ctx.lineTo(6, -19);
      ctx.moveTo(4, -15); ctx.lineTo(9, -15); ctx.stroke();
      ctx.strokeStyle = "#9b7468"; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(10, -22); ctx.lineTo(12, -20); ctx.moveTo(10, -19); ctx.lineTo(12, -17); ctx.stroke();
      polygon([[-23,-35],[-10,-44],[9,-41],[17,-34],[6,-34],[-2,-23],[-5,-10],
        [-12,-5],[-11,-20],[-18,-13],[-15,-27],[-23,-20]], "#293243");
      ctx.strokeStyle = "#49546b"; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-7,-38); ctx.quadraticCurveTo(-9,-27,-13,-20);
      ctx.moveTo(3,-38); ctx.lineTo(-5,-25); ctx.stroke();
      ctx.restore();
    } else if (id === "naruto-rasenshuriken") {
      ctx.shadowColor = "transparent"; ctx.lineJoin = "round"; ctx.lineCap = "round";
      const polygon = (points, fill, edge = "#35404c", width = 1.2) => {
        ctx.fillStyle = fill; ctx.strokeStyle = edge; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(...points[0]);
        for (const point of points.slice(1)) ctx.lineTo(...point);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      };
      const orange = ctx.createLinearGradient(-12, 0, 12, 39);
      orange.addColorStop(0, "#ffbd62"); orange.addColorStop(0.45, "#f38b35"); orange.addColorStop(1, "#c85b2c");
      // Spiky blond hair behind the head and the forehead protector.
      polygon([[-15,-25],[-19,-34],[-11,-32],[-13,-41],[-5,-37],[0,-45],
        [4,-37],[13,-42],[12,-33],[20,-35],[15,-25]], "#f5c447", "#b78131");
      for (const x of [-9, 2]) {
        ctx.fillStyle = orange; ctx.strokeStyle = "#935035"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect(x, 15, 8.5, 26, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#e3cfb5"; ctx.beginPath(); ctx.roundRect(x - 0.5, 42, 10, 5, 2); ctx.fill();
        ctx.fillStyle = "#263946"; ctx.fillRect(x - 0.5, 40, 10, 4);
      }
      polygon([[-11,-9],[10,-9],[14,7],[10,23],[-10,23],[-14,7]], orange);
      polygon([[-11,-9],[10,-9],[12,5],[-12,5]], "#343d48");
      ctx.strokeStyle = "#af633a"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 21); ctx.stroke();
      ctx.fillStyle = "#c2c6c8"; ctx.beginPath(); ctx.roundRect(-5, -10, 10, 4, 1); ctx.fill();
      // One arm lowered, the other hand supporting the wind-chakra sphere.
      ctx.strokeStyle = "#323b48"; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(-11,-4); ctx.lineTo(-19,8); ctx.lineTo(-16,14); ctx.stroke();
      ctx.strokeStyle = "#ed8b36"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-17,3); ctx.lineTo(-19,9); ctx.stroke();
      ctx.strokeStyle = "#323b48"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(10,-4); ctx.lineTo(18,-3); ctx.lineTo(24,-11); ctx.stroke();
      ctx.strokeStyle = "#ed8b36"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(18,-3); ctx.lineTo(24,-10); ctx.stroke();
      ctx.fillStyle = "#edc4a0";
      for (const [x,y] of [[-16,14],[24,-11]]) { ctx.beginPath(); ctx.arc(x,y,3.7,0,Math.PI*2); ctx.fill(); }
      const skin = ctx.createLinearGradient(-10,-34,11,-10);
      skin.addColorStop(0,"#ffe0b6"); skin.addColorStop(1,"#dba27c");
      ctx.fillStyle = skin; ctx.strokeStyle = "#b17e62"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0,-23,13,15,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#273c52"; ctx.beginPath(); ctx.roundRect(-14,-34,28,7,2); ctx.fill();
      const plate = ctx.createLinearGradient(-8,-34,8,-28);
      plate.addColorStop(0,"#f1f4f4"); plate.addColorStop(1,"#859bab");
      ctx.fillStyle = plate; ctx.beginPath(); ctx.roundRect(-8.5,-33.3,17,5.8,1.4); ctx.fill();
      ctx.strokeStyle = "#4d6374"; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(-0.5,-30.4,1.5,0.1,Math.PI*1.8);
      ctx.lineTo(2.6,-31.8); ctx.moveTo(-2,-29.5); ctx.lineTo(-3.8,-29.4); ctx.stroke();
      ctx.fillStyle = "#fffaf0";
      for (const x of [-5,5]) {
        ctx.beginPath(); ctx.ellipse(x,-23.5,3.2,2,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#3b8fb7"; ctx.beginPath(); ctx.arc(x,-23.5,1.4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fffaf0";
      }
      ctx.strokeStyle = "#8c674f"; ctx.lineWidth = 0.85;
      for (const side of [-1,1]) {
        for (const y of [-20,-17.7,-15.5]) { ctx.beginPath(); ctx.moveTo(side*7,y); ctx.lineTo(side*11,y-0.8); ctx.stroke(); }
      }
      ctx.beginPath(); ctx.moveTo(-3,-13); ctx.quadraticCurveTo(0,-11.2,4,-13.7); ctx.stroke();
      // Four spinning wind blades around a luminous Rasengan core.
      const time = effect.time || 0, spin = effect.animated ? time * 2.1 : 0.22;
      const pulse = effect.animated ? 0.5 + 0.5 * Math.sin(time * 2.2) : 0.5;
      ctx.save(); ctx.translate(26,-22);
      const aura = ctx.createRadialGradient(0,0,2,0,0,22);
      aura.addColorStop(0,"rgba(109,212,255,0.45)"); aura.addColorStop(1,"rgba(109,212,255,0)");
      ctx.fillStyle = aura; ctx.fillRect(-23,-23,46,46);
      ctx.save(); ctx.rotate(spin); ctx.shadowColor = "#87ddff"; ctx.shadowBlur = 5 + pulse * 4;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        polygon([[3,-3],[13,-6],[20,0],[10,2],[4,6]], "#d5f6ffcf", "#89dafa", 0.75);
      }
      ctx.restore();
      const chakra = ctx.createRadialGradient(-2,-3,1,0,0,9);
      chakra.addColorStop(0,"#ffffff"); chakra.addColorStop(0.4,"#b4edff"); chakra.addColorStop(1,"#369bd4");
      ctx.fillStyle = chakra; ctx.shadowColor = "#72d6ff"; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
      ctx.shadowColor = "transparent"; ctx.strokeStyle = "#efffff"; ctx.lineWidth = 0.9;
      ctx.rotate(-spin*1.4);
      for (let i = 0; i < 3; i++) {
        ctx.rotate(Math.PI*2/3); ctx.beginPath(); ctx.ellipse(0,0,6,2.6,0,0,Math.PI*1.65); ctx.stroke();
      }
      ctx.restore();
    } else if (id === "eren-titan") {
      ctx.shadowColor = "transparent"; ctx.lineJoin = "round"; ctx.lineCap = "round";
      const polygon = (points, fill, edge = "#343b36", width = 1.2) => {
        ctx.fillStyle = fill; ctx.strokeStyle = edge; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(...points[0]);
        for (const point of points.slice(1)) ctx.lineTo(...point);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      };
      // The Attack Titan towers behind Eren as a separate, larger silhouette.
      const titanSkin = ctx.createLinearGradient(-6,-29,33,34);
      titanSkin.addColorStop(0,"#e2bc91"); titanSkin.addColorStop(0.5,"#b48a69"); titanSkin.addColorStop(1,"#735649");
      polygon([[-8,-5],[28,-6],[40,5],[39,27],[30,29],[24,14],[26,36],
        [-2,36],[-3,16],[-12,27],[-18,22],[-15,5]], titanSkin, "#685545");
      ctx.strokeStyle = "#715748"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(10,3); ctx.lineTo(10,28);
      ctx.moveTo(-3,7); ctx.quadraticCurveTo(2,2,9,7); ctx.quadraticCurveTo(17,1,28,7);
      ctx.moveTo(-2,13); ctx.quadraticCurveTo(3,17,10,13); ctx.quadraticCurveTo(18,17,26,12);
      for (const y of [20,26]) { ctx.moveTo(3,y); ctx.quadraticCurveTo(10,y+3,19,y); }
      ctx.moveTo(33,7); ctx.quadraticCurveTo(29,14,33,24); ctx.stroke();
      polygon([[-1,31],[26,31],[28,39],[-3,39]], "#514a43", "#514a43");
      polygon([[-8,-23],[-15,-28],[-10,-13],[-3,-11]], titanSkin, "#765d49");
      polygon([[30,-24],[40,-29],[34,-12],[27,-10]], titanSkin, "#765d49");
      polygon([[-4,-37],[23,-38],[31,-25],[29,-8],[21,2],[8,5],[-2,-4],[-8,-20]], titanSkin, "#705642");
      // Angular brow, green eyes, and the Titan's distinctive broad toothed jaw.
      ctx.fillStyle = "#45433a";
      polygon([[-3,-24],[8,-28],[11,-22],[1,-21]], "#47463a", "#47463a");
      polygon([[15,-23],[19,-28],[29,-25],[25,-21]], "#47463a", "#47463a");
      ctx.fillStyle = "#a9eac3";
      for (const [x,y] of [[4,-22],[22,-22]]) { ctx.beginPath(); ctx.ellipse(x,y,3.1,1.4,-0.1,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle = "#244f42";
      for (const x of [4,22]) { ctx.beginPath(); ctx.arc(x,-22,0.8,0,Math.PI*2); ctx.fill(); }
      ctx.strokeStyle = "#78604c"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(12,-23); ctx.lineTo(10,-15); ctx.lineTo(15,-13); ctx.stroke();
      polygon([[0,-11],[8,-13],[22,-12],[28,-10],[23,-2],[7,0],[1,-5]], "#534b43", "#534b43");
      ctx.fillStyle = "#eee6d3"; ctx.beginPath(); ctx.roundRect(2,-10,23,7,2); ctx.fill();
      ctx.strokeStyle = "#7c7466"; ctx.lineWidth = 0.65;
      ctx.beginPath(); ctx.moveTo(2,-6.5); ctx.lineTo(25,-6.5);
      for (let x=5;x<25;x+=3.3) { ctx.moveTo(x,-10); ctx.lineTo(x,-3); } ctx.stroke();
      // Long dark hair and a pointed fringe frame the Titan's face.
      polygon([[-8,-17],[-13,-33],[-6,-31],[-8,-43],[0,-40],[0,-48],[10,-43],[21,-47],
        [25,-39],[34,-41],[31,-31],[38,-30],[31,-17],[34,2],[27,-4],[27,-23],
        [22,-34],[13,-31],[8,-37],[1,-29],[-5,-25],[-4,-7],[-10,4]], "#313b35", "#26322d");
      ctx.strokeStyle = "#536050"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(2,-40); ctx.lineTo(-5,-28); ctx.moveTo(21,-39); ctx.lineTo(28,-28);
      ctx.moveTo(31,-27); ctx.lineTo(30,-9); ctx.stroke();
      // Human Eren in front: green cloak, cropped jacket, white trousers, and boots.
      polygon([[-27,0],[-10,1],[-4,31],[-14,28],[-32,33]], "#4b7358", "#304e3c");
      ctx.fillStyle = "#d6d8ce"; ctx.strokeStyle = "#6e6f62"; ctx.lineWidth = 1;
      for (const x of [-25,-15]) {
        ctx.beginPath(); ctx.roundRect(x,22,7,18,1); ctx.fill(); ctx.stroke();
      }
      ctx.strokeStyle = "#72523c"; ctx.lineWidth = 1.9;
      ctx.beginPath(); ctx.moveTo(-24,25); ctx.lineTo(-19,35); ctx.moveTo(-14,25); ctx.lineTo(-9,35); ctx.stroke();
      ctx.fillStyle = "#54483c";
      for (const x of [-26,-16]) { ctx.beginPath(); ctx.roundRect(x,37,8,11,1.5); ctx.fill(); }
      polygon([[-25,2],[-12,2],[-10,24],[-27,24]], "#e2dfcf");
      polygon([[-26,1],[-20,3],[-23,17],[-28,18]], "#ad8055", "#6c533b");
      polygon([[-14,2],[-10,4],[-9,18],[-16,17]], "#ad8055", "#6c533b");
      ctx.fillStyle = "#65503e"; ctx.fillRect(-27,21,18,3);
      ctx.strokeStyle = "#8e6c49"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-27,5); ctx.lineTo(-30,19); ctx.moveTo(-10,6); ctx.lineTo(-8,19); ctx.stroke();
      ctx.fillStyle = "#e8bc96";
      for (const x of [-30,-8]) { ctx.beginPath(); ctx.arc(x,21,2.4,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle = "#e4ebdf"; ctx.beginPath(); ctx.roundRect(-12,6,4,5,0.7); ctx.fill();
      ctx.strokeStyle = "#4e7981"; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(-11,7); ctx.lineTo(-10,10); ctx.lineTo(-9,7); ctx.stroke();
      const humanSkin = ctx.createLinearGradient(-25,-17,-11,1);
      humanSkin.addColorStop(0,"#f1cfaa"); humanSkin.addColorStop(1,"#c39877");
      ctx.fillStyle = humanSkin; ctx.strokeStyle = "#8b7058"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(-19,-8,9,11,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#dbe9df";
      for (const x of [-22.7,-15.5]) { ctx.beginPath(); ctx.ellipse(x,-8.5,2,1.2,0,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle = "#427c66";
      for (const x of [-22.7,-15.5]) { ctx.beginPath(); ctx.arc(x,-8.5,1,0,Math.PI*2); ctx.fill(); }
      ctx.strokeStyle = "#855e4f"; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(-21,-1.5); ctx.lineTo(-17,-1.5); ctx.stroke();
      polygon([[-28,-4],[-31,-15],[-25,-15],[-25,-22],[-18,-19],[-12,-21],[-7,-13],
        [-11,-4],[-12,-12],[-16,-14],[-19,-10],[-22,-14],[-26,-8]], "#514738", "#393c31");
    } else if (id === "gojo-purple") {
      ctx.shadowColor = "transparent"; ctx.lineCap = "round"; ctx.lineJoin = "round";
      const polygon = (points, fill, edge = "#303243", width = 1.2) => {
        ctx.fillStyle = fill; ctx.strokeStyle = edge; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(...points[0]);
        for (const point of points.slice(1)) ctx.lineTo(...point);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      };
      const uniform = ctx.createLinearGradient(-14,-12,16,40);
      uniform.addColorStop(0,"#41425d"); uniform.addColorStop(0.45,"#292b42"); uniform.addColorStop(1,"#181d30");
      // Slim uniform and dark boots.
      for (const x of [-10,2]) {
        ctx.fillStyle = uniform; ctx.strokeStyle = "#1c2132"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect(x,17,8,26,1.8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#171e2b"; ctx.beginPath(); ctx.roundRect(x-1,41,10,7,1.8); ctx.fill();
        ctx.strokeStyle = "#52596c"; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x,46); ctx.lineTo(x+8,46); ctx.stroke();
      }
      polygon([[-11,-11],[10,-11],[14,1],[10,23],[-11,23],[-15,1]], uniform);
      ctx.strokeStyle = "#676684"; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(1,-8); ctx.lineTo(1,21); ctx.moveTo(-10,6); ctx.lineTo(-5,8); ctx.stroke();
      ctx.strokeStyle = "#2d3048"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-13,-1); ctx.lineTo(-17,13); ctx.lineTo(-12,19); ctx.stroke();
      ctx.fillStyle = "#e9c6ba"; ctx.beginPath(); ctx.ellipse(-12,19,2.5,3.2,-0.4,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#303149"; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(11,-3); ctx.lineTo(18,1); ctx.lineTo(20,-8); ctx.stroke();
      ctx.strokeStyle = "#e9c6ba"; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(20,-7); ctx.lineTo(18,-13); ctx.stroke();
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(17,-12); ctx.lineTo(16,-18); ctx.moveTo(19,-12); ctx.lineTo(19,-18); ctx.stroke();
      const skin = ctx.createLinearGradient(-8,-37,10,-13);
      skin.addColorStop(0,"#fff0dd"); skin.addColorStop(1,"#d9aaa0");
      ctx.fillStyle = skin; ctx.strokeStyle = "#af8c88"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(0,-27,12,14,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      polygon([[-11,-16],[-4,-12],[8,-14],[11,-7],[-10,-5]], "#36374f");
      ctx.strokeStyle = "#64617d"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-8,-14); ctx.lineTo(-6,-7); ctx.stroke();
      // Black eye covering and a faint smile beneath the fringe.
      polygon([[-13,-32],[13,-32],[13,-25],[-13,-24]], "#202331", "#171d2a", 0.8);
      polygon([[-12,-29],[-20,-26],[-16,-22],[-11,-25]], "#292d3e", "#202635", 0.7);
      ctx.strokeStyle = "#555b70"; ctx.lineWidth = 0.65;
      ctx.beginPath(); ctx.moveTo(-11,-30); ctx.quadraticCurveTo(0,-28,11,-30); ctx.stroke();
      ctx.strokeStyle = "#a27673"; ctx.lineWidth = 0.85;
      ctx.beginPath(); ctx.moveTo(-2,-18.7); ctx.quadraticCurveTo(1,-16.6,5,-19); ctx.stroke();
      const hair = ctx.createLinearGradient(-11,-46,12,-27);
      hair.addColorStop(0,"#ffffff"); hair.addColorStop(0.6,"#e2eaf1"); hair.addColorStop(1,"#abbacb");
      polygon([[-13,-25],[-20,-35],[-12,-33],[-14,-44],[-6,-40],[-1,-49],
        [5,-40],[14,-45],[11,-35],[20,-37],[14,-25],[7,-31],[3,-26],[-2,-32],[-8,-27]], hair, "#8495a9", 0.9);
      ctx.strokeStyle = "#b3c0d0"; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(-5,-41); ctx.lineTo(-6,-31); ctx.moveTo(5,-39); ctx.lineTo(7,-32); ctx.stroke();
      // A softly pulsing Hollow Purple sphere with orbiting energy.
      const time = effect.time || 0, spin = effect.animated ? time * 1.6 : 0.45;
      const pulse = effect.animated ? 0.5 + 0.5 * Math.sin(time * 1.9) : 0.5;
      ctx.save(); ctx.translate(30,-10);
      const aura = ctx.createRadialGradient(0,0,2,0,0,18);
      aura.addColorStop(0,"rgba(170,104,255,0.62)"); aura.addColorStop(1,"rgba(157,76,255,0)");
      ctx.fillStyle = aura; ctx.fillRect(-19,-19,38,38);
      ctx.save(); ctx.rotate(spin);
      ctx.strokeStyle = "#bd8dff99"; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.ellipse(0,0,14.5,5.7,-0.3,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0,0,12.5,7.5,1.1,0,Math.PI*2); ctx.stroke();
      for (const [angle,color] of [[0,"#ff8cce"],[Math.PI,"#8bcaff"]]) {
        const x=Math.cos(angle)*14.5,y=Math.sin(angle)*5.7;
        ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=5;
        ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
      const purple = ctx.createRadialGradient(-2.4,-3,0.5,0,0,9.5);
      purple.addColorStop(0,"#fff2ff"); purple.addColorStop(0.23,"#e2b6ff");
      purple.addColorStop(0.65,"#a25aff"); purple.addColorStop(1,"#5930a9");
      ctx.fillStyle=purple;ctx.shadowColor="#ae62ff";ctx.shadowBlur=7+pulse*5;
      ctx.beginPath();ctx.arc(0,0,8.8,0,Math.PI*2);ctx.fill();
      ctx.shadowColor="transparent";ctx.strokeStyle="#f2d9ff";ctx.lineWidth=0.8;
      ctx.rotate(-spin*1.3);
      ctx.beginPath();ctx.ellipse(0,0,6.4,3.1,0.4,0,Math.PI*1.75);ctx.stroke();
      ctx.strokeStyle="#d3a4ff";ctx.lineWidth=0.7;
      for(let i=0;i<3;i++){
        ctx.rotate(Math.PI*2/3);ctx.beginPath();ctx.moveTo(10,-2);ctx.lineTo(13,-4);ctx.lineTo(11,1);ctx.stroke();
      }
      ctx.restore();
    } else if (id === "kitt") {
      ctx.shadowColor = "transparent"; ctx.lineJoin = "round"; ctx.lineCap = "round";
      const polygon = (points, fill, edge = "#637180", width = 1.1) => {
        ctx.fillStyle = fill; ctx.strokeStyle = edge; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(...points[0]);
        for (const point of points.slice(1)) ctx.lineTo(...point);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      };
      // A small roof loop joins the car to the hanging cord.
      ctx.strokeStyle="#8c9dab";ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(0,-35.5,4,4.5,0,0,Math.PI*2);ctx.stroke();
      // Wide black tires sit behind the low front bodywork.
      ctx.fillStyle="#111820";ctx.strokeStyle="#465463";ctx.lineWidth=1;
      for(const x of [-39,29]){
        ctx.beginPath();ctx.roundRect(x,8,10,19,3);ctx.fill();ctx.stroke();
        ctx.strokeStyle="#6a7682";ctx.lineWidth=0.7;
        ctx.beginPath();ctx.moveTo(x+2,16);ctx.lineTo(x+2,23);ctx.stroke();
        ctx.strokeStyle="#465463";ctx.lineWidth=1;
      }
      const roof=ctx.createLinearGradient(0,-31,0,-10);
      roof.addColorStop(0,"#485360");roof.addColorStop(0.3,"#171f29");roof.addColorStop(1,"#0b111a");
      polygon([[-19,-31],[19,-31],[31,-13],[-31,-13]],roof);
      const glass=ctx.createLinearGradient(-18,-27,16,-12);
      glass.addColorStop(0,"#526b81");glass.addColorStop(0.48,"#293d50");glass.addColorStop(1,"#14202f");
      polygon([[-17,-27],[17,-27],[25,-15],[-25,-15]],glass,"#758494",0.8);
      ctx.strokeStyle="#b4c6d333";ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(-14,-25);ctx.lineTo(7,-25);ctx.moveTo(-13,-24);ctx.lineTo(-19,-17);ctx.stroke();
      const body=ctx.createLinearGradient(-10,-12,7,22);
      body.addColorStop(0,"#3e4b5a");body.addColorStop(0.3,"#1a2531");body.addColorStop(0.7,"#080d15");body.addColorStop(1,"#242e3a");
      polygon([[-30,-14],[30,-14],[43,-2],[46,7],[40,21],[-40,21],[-46,7],[-43,-2]],body,"#6b7b8d",1.3);
      const hood=ctx.createLinearGradient(0,-13,0,8);
      hood.addColorStop(0,"#293746");hood.addColorStop(0.45,"#111a25");hood.addColorStop(1,"#070d15");
      polygon([[-29,-12],[29,-12],[40,0],[35,8],[-35,8],[-40,0]],hood,"#465665",0.7);
      ctx.strokeStyle="#778b9c66";ctx.lineWidth=0.8;
      ctx.beginPath();ctx.moveTo(-23,-10);ctx.lineTo(-32,0);ctx.moveTo(23,-10);ctx.lineTo(32,0);
      ctx.moveTo(-36,1);ctx.lineTo(-23,1);ctx.moveTo(23,1);ctx.lineTo(36,1);ctx.stroke();
      // Closed pop-up headlamp panels and the front bumper.
      polygon([[-37,1],[-25,1],[-23,5],[-36,5]],"#283746","#647484",0.65);
      polygon([[25,1],[37,1],[36,5],[23,5]],"#283746","#647484",0.65);
      ctx.fillStyle="#050910";ctx.beginPath();ctx.roundRect(-20,2,40,7.5,2);ctx.fill();
      ctx.fillStyle="#0b111a";ctx.beginPath();ctx.roundRect(-31,12,62,5,1.5);ctx.fill();
      ctx.strokeStyle="#778a9b";ctx.lineWidth=0.8;
      ctx.beginPath();ctx.moveTo(-35,18);ctx.lineTo(35,18);ctx.moveTo(-39,11);ctx.lineTo(-34,11);ctx.moveTo(34,11);ctx.lineTo(39,11);ctx.stroke();
      polygon([[-1.5,11],[1.5,11],[0,14]],"#b7a491","#514b48",0.4);
      ctx.fillStyle="#52606d";ctx.beginPath();ctx.roundRect(-7,18.5,14,3.6,0.7);ctx.fill();
      // KITT's scanner sweeps smoothly across the recessed red light bar.
      const time=effect.time||0;
      const beam=effect.animated?Math.sin(time*2.1)*14:0;
      ctx.save();
      for(let i=0;i<9;i++){
        const x=-16+i*4, strength=Math.exp(-Math.pow((x-beam)/5.2,2));
        ctx.fillStyle="rgba(255,"+Math.round(25+strength*50)+","+Math.round(20+strength*30)+","+(0.17+strength*0.83)+")";
        ctx.shadowColor="#ff2839";ctx.shadowBlur=2+strength*7;
        ctx.beginPath();ctx.roundRect(x-1.5,4,3,3.3,0.7);ctx.fill();
      }
      ctx.fillStyle="#ffd0bc";ctx.shadowColor="#ff3440";ctx.shadowBlur=6;
      ctx.beginPath();ctx.roundRect(beam-0.75,4.6,1.5,2,0.5);ctx.fill();
      ctx.restore();
    } else if (id === "stopwatch") {
      ctx.shadowColor = "transparent"; ctx.lineCap = "round";
      // A steel case, top crown, and a blue dial with a live digital readout.
      ctx.strokeStyle="#758b9e";ctx.lineWidth=2.5;
      ctx.beginPath();ctx.ellipse(0,-45,5.2,4.2,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#8399ac";ctx.beginPath();ctx.roundRect(-5,-43,10,9,2);ctx.fill();
      ctx.save();ctx.translate(25,-30);ctx.rotate(0.7);ctx.fillStyle="#71899d";ctx.fillRect(-4,-4,8,7);ctx.restore();
      const steel=ctx.createLinearGradient(-30,-30,30,32);
      steel.addColorStop(0,"#f3f8fa");steel.addColorStop(0.3,"#a6bbc9");
      steel.addColorStop(0.7,"#5d798f");steel.addColorStop(1,"#d5e5ed");
      ctx.fillStyle=steel;ctx.shadowColor="#17344840";ctx.shadowBlur=7;ctx.shadowOffsetY=4;
      ctx.beginPath();ctx.arc(0,0,38,0,Math.PI*2);ctx.fill();ctx.shadowColor="transparent";
      const dial=ctx.createRadialGradient(-9,-14,1,0,0,34);
      dial.addColorStop(0,"#263e52");dial.addColorStop(1,"#0c1928");
      ctx.fillStyle=dial;ctx.beginPath();ctx.arc(0,0,33.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#d0e4ee";ctx.lineWidth=0.8;
      for(let i=0;i<60;i++){
        const a=i*Math.PI/30-Math.PI/2,r=i%5===0?26:29;
        ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*31,Math.sin(a)*31);ctx.stroke();
      }
      const elapsed=effect.elapsedMs||0;
      const angle=effect.reducedMotion?0:(elapsed%60000)/60000*Math.PI*2;
      ctx.save();ctx.rotate(angle);ctx.strokeStyle="#75e5cd";ctx.lineWidth=1.7;
      ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(0,-24);ctx.stroke();ctx.restore();
      ctx.fillStyle="#dceef1";ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#111f2e";ctx.beginPath();ctx.roundRect(-28,12,56,15,3);ctx.fill();
      ctx.strokeStyle="#536d7d";ctx.lineWidth=0.6;ctx.stroke();
      ctx.fillStyle="#dcfff0";ctx.font="600 11px monospace";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(NS.formatStopwatch(elapsed),0,20,51);
      ctx.fillStyle="#9cb6c7";ctx.font="4.8px sans-serif";ctx.fillText("STOPWATCH",0,-12);
    } else if (id === "cpts-certificate") {
      ctx.shadowColor="transparent";ctx.lineJoin="round";ctx.lineCap="round";
      ctx.strokeStyle="#8b9caa";ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(0,-36.5,4.2,4.5,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#8597a4";ctx.fillRect(-3,-34,6,5);
      const frame=ctx.createLinearGradient(-43,-30,44,32);
      frame.addColorStop(0,"#56636d");frame.addColorStop(0.25,"#1a252e");
      frame.addColorStop(0.75,"#0c151e");frame.addColorStop(1,"#354a56");
      ctx.fillStyle=frame;ctx.shadowColor="#13253138";ctx.shadowBlur=8;ctx.shadowOffsetY=5;
      ctx.beginPath();ctx.roundRect(-46,-31,92,66,3);ctx.fill();ctx.shadowColor="transparent";
      ctx.strokeStyle="#8b9ca7";ctx.lineWidth=0.8;ctx.stroke();
      const paper=ctx.createLinearGradient(0,-26,0,30);
      paper.addColorStop(0,"#fffef6");paper.addColorStop(1,"#e5eadb");
      ctx.fillStyle=paper;ctx.fillRect(-41,-26,82,56);
      ctx.strokeStyle="#95c850";ctx.lineWidth=0.65;ctx.strokeRect(-37,-22,74,48);
      ctx.fillStyle="#172b35";ctx.fillRect(-41,-26,82,14);
      // A small isometric cube and header keep the certification theme readable.
      ctx.save();ctx.translate(-28,-19);ctx.strokeStyle="#9fef00";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(4,-2);ctx.lineTo(4,3);ctx.lineTo(0,5);
      ctx.lineTo(-4,3);ctx.lineTo(-4,-2);ctx.closePath();ctx.moveTo(-4,-2);ctx.lineTo(0,0);
      ctx.lineTo(4,-2);ctx.moveTo(0,0);ctx.lineTo(0,5);ctx.stroke();ctx.restore();
      ctx.fillStyle="#d9f1df";ctx.font="600 5.3px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText("HTB ACADEMY",6,-18.5,48);
      ctx.fillStyle="#234133";ctx.font="800 17px sans-serif";ctx.fillText("CPTS",0,0,61);
      ctx.fillStyle="#516454";ctx.font="600 3.6px sans-serif";
      ctx.fillText("CERTIFIED PENETRATION",0,10,66);ctx.fillText("TESTING SPECIALIST",0,16,60);
      // Decorative signature strokes and an embossed seal.
      ctx.strokeStyle="#9aab93";ctx.lineWidth=0.65;
      ctx.beginPath();ctx.moveTo(-30,22);ctx.quadraticCurveTo(-25,16,-23,22);
      ctx.quadraticCurveTo(-20,25,-16,20);ctx.lineTo(-11,22);ctx.moveTo(-30,25);ctx.lineTo(-8,25);ctx.stroke();
      ctx.fillStyle="#5d823f";ctx.beginPath();ctx.moveTo(24,23);ctx.lineTo(22,31);ctx.lineTo(27,28);
      ctx.lineTo(31,31);ctx.lineTo(30,23);ctx.closePath();ctx.fill();
      const seal=ctx.createRadialGradient(25,19,1,27,21,6);
      seal.addColorStop(0,"#c1f375");seal.addColorStop(1,"#72a441");
      ctx.fillStyle=seal;ctx.beginPath();ctx.arc(27,21,6,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#4d7836";ctx.lineWidth=0.7;ctx.stroke();
      ctx.strokeStyle="#f3ffe0";ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(24,21);ctx.lineTo(26,23);ctx.lineTo(30,19);ctx.stroke();
    } else if (id === "glowing-diamond") {
      ctx.shadowColor="transparent";ctx.lineJoin="round";
      const time=effect.time||0;
      const radiance=effect.animated?0.82+Math.sin(time*1.7)*0.12:0.88;
      const gem=new Path2D();
      gem.moveTo(-21,-33);gem.lineTo(21,-33);gem.lineTo(35,-12);gem.lineTo(0,39);gem.lineTo(-35,-12);gem.closePath();
      const halo=ctx.createRadialGradient(0,-5,4,0,-5,49);
      halo.addColorStop(0,"rgba(166,240,255,"+(radiance*0.55)+")");
      halo.addColorStop(0.45,"rgba(101,184,255,"+(radiance*0.32)+")");
      halo.addColorStop(1,"rgba(109,123,255,0)");
      ctx.fillStyle=halo;ctx.fillRect(-50,-55,100,108);
      for(const [x,color] of [[-20,"85,223,255"],[22,"177,123,255"]]){
        const light=ctx.createRadialGradient(x,2,1,x,2,27);
        light.addColorStop(0,"rgba("+color+","+(radiance*0.3)+")");
        light.addColorStop(1,"rgba("+color+",0)");
        ctx.fillStyle=light;ctx.fillRect(x-28,-26,56,56);
      }
      ctx.save();ctx.shadowColor="#72deff";ctx.shadowBlur=19;ctx.lineWidth=3;
      ctx.strokeStyle="#b4f5ff";ctx.stroke(gem);
      ctx.shadowColor="#b39bff";ctx.shadowBlur=9;ctx.lineWidth=1.5;ctx.stroke(gem);ctx.restore();
      const facet=(points,fill)=>{
        ctx.fillStyle=fill;ctx.strokeStyle="#e4fbffb3";ctx.lineWidth=0.8;
        ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);
        ctx.closePath();ctx.fill();ctx.stroke();
      };
      facet([[-21,-33],[-14,-30],[-10,-12],[-35,-12]],"#83ddff");
      facet([[21,-33],[14,-30],[10,-12],[35,-12]],"#b0bcff");
      facet([[-21,-33],[21,-33],[14,-30],[-14,-30]],"#f7ffff");
      facet([[-14,-30],[14,-30],[10,-12],[-10,-12]],"#dcffff");
      const center=ctx.createLinearGradient(0,-12,0,39);
      center.addColorStop(0,"#f1ffff");center.addColorStop(0.42,"#b7e5ff");center.addColorStop(1,"#8f91ff");
      facet([[-10,-12],[10,-12],[0,39]],center);
      facet([[-35,-12],[-10,-12],[0,39]],"#66b8f4");
      facet([[35,-12],[10,-12],[0,39]],"#9b9af4");
      facet([[-35,-12],[-23,9],[0,39],[-15,9]],"#9ddffd");
      facet([[35,-12],[23,9],[0,39],[15,9]],"#c3b9ff");
      ctx.save();ctx.clip(gem);
      const sweep=effect.animated?((time*0.38)%1)*120-60:-8;
      ctx.rotate(-0.35);
      const shine=ctx.createLinearGradient(sweep-12,0,sweep+12,0);
      shine.addColorStop(0,"rgba(255,255,255,0)");shine.addColorStop(0.5,"rgba(255,255,255,0.8)");shine.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=shine;ctx.fillRect(sweep-12,-65,24,130);ctx.restore();
      // Permanent icy highlights and softly changing star-shaped glints.
      ctx.strokeStyle="#ffffff";ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(-20,-30);ctx.lineTo(19,-30);ctx.moveTo(-31,-12);ctx.lineTo(-11,-12);ctx.stroke();
      for(const [i,x,y] of [[0,-33,-26],[1,36,10],[2,3,-39],[3,-18,32]]){
        const glow=effect.animated?0.62+0.28*Math.sin(time*1.8+i*1.9):0.8;
        const radius=3.8+glow*2;
        ctx.save();ctx.translate(x,y);ctx.globalAlpha=0.65+glow*0.3;
        ctx.fillStyle="#f6ffff";ctx.shadowColor=i%2?"#c4acff":"#93e9ff";ctx.shadowBlur=7;
        ctx.beginPath();
        for(let j=0;j<8;j++){
          const a=j*Math.PI/4-Math.PI/2,r=j%2?radius*0.2:radius;
          if(j)ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
        }
        ctx.closePath();ctx.fill();ctx.restore();
      }
      ctx.strokeStyle="#b5dae9";ctx.lineWidth=1.6;
      ctx.beginPath();ctx.ellipse(0,-39.5,3.5,4.5,0,0,Math.PI*2);ctx.stroke();
    } else if (id === "superbike") {
      ctx.shadowColor = "transparent";
      const image = NS.builtinArt?.superbike;
      if (image) {
        const time = effect.time || 0;
        const width = 120, height = image.height / image.width * width;
        // Keep the hanging eyelet fixed while the engine gently vibrates.
        ctx.translate(0, -height / 2);
        if (effect.animated) ctx.rotate(Math.sin(time * 32) * 0.004);
        ctx.translate(-width * 0.519, 0);
        // Animation landmarks use the original 1774 x 887 artwork coordinates.
        ctx.scale(width / 1774, width / 1774);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
        const paint = () => ctx.drawImage(image, 0, 0, 1774, 887);
        paint();
        if (effect.animated) {
          // Rotate wheel interiors; the forks, swingarm and caliper stay stationary.
          for (const [x, y, radius] of [[282, 627, 176], [1493, 648, 171]]) {
            ctx.save();
            ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
            ctx.clearRect(x - radius, y - radius, radius * 2, radius * 2);
            ctx.translate(x, y); ctx.rotate(time * 4);
            ctx.translate(-x, -y); paint(); ctx.restore();
          }
          const restorePart = points => {
            ctx.save(); ctx.beginPath(); ctx.moveTo(...points[0]);
            for (const point of points.slice(1)) ctx.lineTo(...point);
            ctx.closePath(); ctx.clip(); paint(); ctx.restore();
          };
          restorePart([[270,585],[547,475],[615,533],[339,651],[279,664],[253,637]]);
          restorePart([[300,684],[420,666],[426,707],[305,730]]);
          restorePart([[1337,428],[1396,413],[1468,568],[1523,610],[1540,650],[1490,676],[1451,629],[1415,577]]);
          restorePart([[1364,548],[1403,550],[1414,589],[1386,669],[1359,676],[1343,644],[1348,597]]);
        }
        // An icy headlight softly pulses; a smaller red tail lamp stays visible.
        const pulse = effect.animated ? 0.65 + 0.25 * Math.sin(time * 2.5) : 0.8;
        ctx.save(); ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = pulse;
        ctx.shadowColor = "#a8eaff"; ctx.shadowBlur = 38;
        ctx.fillStyle = "#dbf6ff";
        ctx.beginPath(); ctx.ellipse(1553, 303, 31, 10, 0.48, 0, Math.PI * 2); ctx.fill();
        ctx.shadowColor = "#ff334b"; ctx.shadowBlur = 24; ctx.fillStyle = "#ff5360";
        ctx.beginPath(); ctx.ellipse(184, 150, 15, 7, 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    } else if (id === "toji-knife" || id === "long-range-rifle") {
      ctx.shadowColor = "transparent";
      const image = NS.builtinArt?.[id];
      if (image) {
        const height = id === "long-range-rifle" ? 120 : 100;
        const width = image.width / image.height * height;
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
      } else {
        ctx.strokeStyle = "#a9b8c4"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(-5, -35, 10, 70, 3); ctx.stroke();
      }
    } else if (id === "heart") {
      const fill = ctx.createLinearGradient(0, -35, 0, 40); fill.addColorStop(0, "#f3b2ab"); fill.addColorStop(1, "#da7a7c");
      ctx.fillStyle = fill; ctx.strokeStyle = "#c67073"; ctx.beginPath(); ctx.moveTo(0, 42);
      ctx.bezierCurveTo(-75, -4, -36, -66, 0, -28); ctx.bezierCurveTo(36, -66, 75, -4, 0, 42);
      ctx.closePath(); ctx.fill(); ctx.shadowColor = "transparent"; ctx.stroke(); face(ctx, -2);
    }
    ctx.shadowColor = "transparent"; ctx.restore();
  }
  function imageCanvas(value) {
    if (!NS.validImage(value)) return null;
    try {
      const bytes = Uint8ClampedArray.from(atob(value.pixels), c => c.charCodeAt(0));
      if (bytes.length !== value.width * value.height * 4) return null;
      const canvas = document.createElement("canvas"); canvas.width = value.width; canvas.height = value.height;
      canvas.getContext("2d").putImageData(new ImageData(bytes, value.width, value.height), 0, 0);
      return canvas;
    } catch { return null; }
  }
  Object.assign(NS, { drawCharm, imageCanvas });
})();
