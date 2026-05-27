/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Order } from '../types';
import { TrendingUp, BarChart3, LineChart, X } from 'lucide-react';

interface CashTrendChartProps {
  orders: Order[];
}

interface TrendPoint {
  date: Date;
  dateStr: string;
  cumulative: number;
  daily: number;
}

export default function CashTrendChart({ orders }: CashTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 310 });
  const [chartType, setChartType] = useState<'cumulative' | 'daily'>('cumulative');
  
  // Tooltip tracking state
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Active zoomed sub-range chosen by brush
  const [zoomDomain, setZoomDomain] = useState<[Date, Date] | null>(null);

  // Math trend parser
  const trendData: TrendPoint[] = React.useMemo(() => {
    const data: TrendPoint[] = [];
    const now = new Date();
    
    const sortedOrders = [...orders].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Assemble last 30 calendar days
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      // Daily checkout totals
      const dailySum = sortedOrders
        .filter(o => {
          const d = new Date(o.date);
          return d >= dayStart && d < dayEnd;
        })
        .reduce((sum, o) => sum + o.total, 0);

      // Balance accumulation totals
      const cumulativeSum = sortedOrders
        .filter(o => {
          const d = new Date(o.date);
          return d < dayEnd;
        })
        .reduce((sum, o) => sum + o.total, 0);

      const formatter = new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });

      data.push({
        date: dayStart,
        dateStr: formatter.format(dayStart),
        cumulative: parseFloat(cumulativeSum.toFixed(2)),
        daily: parseFloat(dailySum.toFixed(2))
      });
    }

    return data;
  }, [orders]);

  // Hook resize listener of component container for high responsive fidelity
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Guarantee width is non-zero to prevent d3 dividing errors
      setDimensions({
        width: Math.max(width, 280),
        height: 310
      });
    });

    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Primary rendering effect with D3 selection tree (Focus + Context zoomable brush timeline)
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 15, right: 20, bottom: 25, left: 55 };

    // Layout boundaries to partition Focus (Main) and Context (Brush timeline) charts
    // Height allocation: focusHeight = 180, gap = ~50px, Context timeline = 40px (from y=230 to y=270)
    const focusHeight = 180;
    const contextTop = 230;
    const contextHeight = 40;
    const contextBottom = contextTop + contextHeight;

    // Clear state
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const data = trendData;
    const valueKey = chartType === 'cumulative' ? 'cumulative' : 'daily';

    // 1. Scales
    // Focus X Scale (Zoomable)
    const focusXScale = d3.scaleTime()
      .domain(zoomDomain || d3.extent(data, d => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    // Context X Scale (Always full range)
    const contextXScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    // Focus Y Scale (computes auto-hedged bounds based on the active zoomed sub-range)
    const visibleData = zoomDomain
      ? data.filter(d => d.date >= zoomDomain[0] && d.date <= zoomDomain[1])
      : data;
    const focusMaxVal = d3.max(visibleData.length > 0 ? visibleData : data, d => d[valueKey]) || 100;
    
    const focusYScale = d3.scaleLinear()
      .domain([0, focusMaxVal * 1.08]) // 8% headroom
      .range([focusHeight, margin.top]);

    // Context Y Scale (Fixed standard bounds for the timeline overview)
    const contextMaxVal = d3.max(data, d => d[valueKey]) || 100;
    const contextYScale = d3.scaleLinear()
      .domain([0, contextMaxVal * 1.1])
      .range([contextBottom, contextTop]);

    // 2. Gradients defs
    const defs = svg.append('defs');
    
    const gradient = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', '0.22');

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', '0.00');

    // Define a clip path so focus elements (area, lines, circles) do not bleed outside the chart axes borders on zoom
    defs.append('clipPath')
      .attr('id', 'focus-chart-clip')
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', focusHeight - margin.top);

    // 3. Gridlines
    const yGridGenerator = d3.axisLeft(focusYScale)
      .tickSize(-width + margin.left + margin.right)
      .tickFormat(() => '');

    svg.append('g')
      .attr('class', 'grid-lines')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yGridGenerator)
      .selectAll('.tick line')
      .style('stroke', '#292524')
      .style('stroke-dasharray', '3,3');

    // Remove baseline grid border line
    svg.select('.grid-lines .domain').remove();

    // Create clipped focus group
    const focusGroup = svg.append('g')
      .attr('clip-path', 'url(#focus-chart-clip)');

    // 4. Draw Focus Areas (Clipped)
    if (chartType === 'cumulative') {
      const areaGenerator = d3.area<TrendPoint>()
        .x(d => focusXScale(d.date))
        .y0(focusHeight)
        .y1(d => focusYScale(d[valueKey]))
        .curve(d3.curveMonotoneX);

      focusGroup.append('path')
        .datum(data)
        .attr('class', 'area')
        .attr('fill', 'url(#area-gradient)')
        .attr('d', areaGenerator);
    }

    // 5. Draw Focus Lines (Clipped)
    const lineGenerator = d3.line<TrendPoint>()
      .x(d => focusXScale(d.date))
      .y(d => focusYScale(d[valueKey]))
      .curve(chartType === 'cumulative' ? d3.curveMonotoneX : d3.curveLinear);

    focusGroup.append('path')
      .datum(data)
      .attr('class', 'trend-path')
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', '2.5')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', lineGenerator);

    // 6. Draw Focus daily dots (Clipped)
    if (chartType === 'daily') {
      data.forEach(d => {
        if (d.daily === 0) return;
        
        focusGroup.append('circle')
          .attr('cx', focusXScale(d.date))
          .attr('cy', focusYScale(d.daily))
          .attr('r', '4')
          .attr('fill', '#10b981')
          .attr('stroke', '#0e110e')
          .attr('stroke-width', '1.5');
      });
    }

    // 7. Axis Styling
    const formatMillisecond = d3.timeFormat('.%L'),
          formatSecond = d3.timeFormat(':%S'),
          formatMinute = d3.timeFormat('%I:%M'),
          formatHour = d3.timeFormat('%I %p'),
          formatDay = d3.timeFormat('%b %d'),
          formatWeek = d3.timeFormat('%b %d'),
          formatMonth = d3.timeFormat('%B'),
          formatYear = d3.timeFormat('%Y');

    // Multi-scale time formatting logic
    function multiFormat(date: any) {
      return (d3.timeSecond(date) < date ? formatMillisecond
          : d3.timeMinute(date) < date ? formatSecond
          : d3.timeHour(date) < date ? formatMinute
          : d3.timeDay(date) < date ? formatHour
          : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
          : d3.timeYear(date) < date ? formatMonth
          : formatYear)(date);
    }

    const xAxisFocus = d3.axisBottom(focusXScale)
      .ticks(6)
      .tickFormat(multiFormat as any);

    const yAxisFocus = d3.axisLeft(focusYScale)
      .ticks(4)
      .tickFormat(d => `$${d}`);

    // Call Focus Axes
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${focusHeight})`)
      .call(xAxisFocus)
      .selectAll('.tick text')
      .style('fill', '#a8a29e')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px');

    svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxisFocus)
      .selectAll('.tick text')
      .style('fill', '#a8a29e')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px');

    // Polish focus axes paths borders
    svg.selectAll('.x-axis path, .x-axis line, .y-axis path, .y-axis line')
      .style('stroke', '#292524');


    // 8. Bottom Context (Timeline Navigator / Brush Chart) Drawing
    // Clear/subtle area preview
    if (chartType === 'cumulative') {
      const contextAreaGenerator = d3.area<TrendPoint>()
        .x(d => contextXScale(d.date))
        .y0(contextBottom)
        .y1(d => contextYScale(d[valueKey]))
        .curve(d3.curveMonotoneX);

      svg.append('path')
        .datum(data)
        .attr('class', 'context-area')
        .attr('fill', '#10b981')
        .attr('fill-opacity', '0.07')
        .attr('d', contextAreaGenerator);
    }

    const contextLineGenerator = d3.line<TrendPoint>()
      .x(d => contextXScale(d.date))
      .y(d => contextYScale(d[valueKey]))
      .curve(chartType === 'cumulative' ? d3.curveMonotoneX : d3.curveLinear);

    svg.append('path')
      .datum(data)
      .attr('class', 'context-line')
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-opacity', '0.35')
      .attr('stroke-width', '1.2')
      .attr('d', contextLineGenerator);

    // Call Context bottom X Axis
    const xAxisContext = d3.axisBottom(contextXScale)
      .ticks(5)
      .tickFormat(multiFormat as any);

    svg.append('g')
      .attr('class', 'x-axis-context')
      .attr('transform', `translate(0, ${contextBottom})`)
      .call(xAxisContext)
      .selectAll('.tick text')
      .style('fill', '#6d6966')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '8px');

    svg.selectAll('.x-axis-context path, .x-axis-context line')
      .style('stroke', '#221f1e');


    // 9. D3 Brush Integration
    const brush = d3.brushX()
      .extent([[margin.left, contextTop - 4], [width - margin.right, contextBottom]])
      .on('brush end', (event: any) => {
        // Block programmatic recursive loops
        if (!event.sourceEvent) return;

        const selection = event.selection;
        if (selection) {
          const [x0, x1] = selection as [number, number];
          const start = contextXScale.invert(x0);
          const end = contextXScale.invert(x1);

          if (start.getTime() !== end.getTime()) {
            setZoomDomain([start, end]);
          }
        } else {
          setZoomDomain(null);
        }
      });

    const brushG = svg.append('g')
      .attr('class', 'brush')
      .call(brush);

    // Fine-tune brush aesthetics to look extremely polished
    brushG.select('.selection')
      .attr('fill', '#10b981')
      .attr('fill-opacity', '0.12')
      .attr('stroke', '#10b981')
      .attr('stroke-width', '1')
      .attr('stroke-linecap', 'round');

    // Customize interactive handles
    brushG.selectAll('.handle')
      .attr('fill', '#10b981')
      .attr('stroke', '#0c0e0c')
      .attr('stroke-width', '1');

    // Apply existing zoom domain coordinates back to the brush visual overlay
    if (zoomDomain) {
      const brushLeft = contextXScale(zoomDomain[0]);
      const brushRight = contextXScale(zoomDomain[1]);
      brushG.call(brush.move as any, [brushLeft, brushRight]);
    } else {
      brushG.call(brush.move as any, null);
    }


    // 10. Interactive Tracker Hover Helpers inside Focus view
    const hoverGroup = svg.append('g')
      .attr('class', 'hover-helpers')
      .style('display', 'none');

    // Vertical line track marker
    const trackerLine = hoverGroup.append('line')
      .attr('stroke', '#10b981')
      .attr('stroke-width', '1')
      .attr('stroke-dasharray', '4,4')
      .attr('y1', margin.top)
      .attr('y2', focusHeight);

    // Circle beacon marker
    const trackerDot = hoverGroup.append('circle')
      .attr('fill', '#10b981')
      .attr('stroke', '#0e110e')
      .attr('stroke-width', '2')
      .attr('r', '6');

    // Focus sensory tracker overlay box (maps hover data only inside Focus boundaries)
    svg.append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', focusHeight - margin.top)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [mouseX, mouseY] = d3.pointer(event);
        
        // Find date from inverse coordinate
        const hoveredDate = focusXScale.invert(mouseX);
        
        // Match approximate date target
        const bisect = d3.bisector<TrendPoint, Date>(d => d.date).left;
        const index = bisect(data, hoveredDate, 1);
        
        const ptA = data[index - 1];
        const ptB = data[index];
        
        if (!ptA) return;
        
        let p = ptA;
        if (ptB) {
          p = (hoveredDate.getTime() - ptA.date.getTime() > ptB.date.getTime() - hoveredDate.getTime()) 
            ? ptB 
            : ptA;
        }

        // Only display tooltip if date is within active view domain
        const isPointVisible = !zoomDomain || (p.date >= zoomDomain[0] && p.date <= zoomDomain[1]);
        if (!isPointVisible) {
          hoverGroup.style('display', 'none');
          setHoveredPoint(null);
          setTooltipPos(null);
          return;
        }

        const pointX = focusXScale(p.date);
        const pointY = focusYScale(p[valueKey]);

        // Place tracker assets
        hoverGroup.style('display', null);
        trackerLine.attr('x1', pointX).attr('x2', pointX);
        trackerDot.attr('cx', pointX).attr('cy', pointY);

        setHoveredPoint(p);
        setTooltipPos({
          x: pointX,
          y: pointY - 20
        });
      })
      .on('mouseleave', () => {
        hoverGroup.style('display', 'none');
        setHoveredPoint(null);
        setTooltipPos(null);
      });

  }, [trendData, dimensions, chartType, zoomDomain]);

  return (
    <div 
      className="bg-stone-900 border border-stone-880 rounded-xl p-5 space-y-4 shadow relative" 
      ref={containerRef}
      id="live-cash-trend-block"
    >
      {/* Header Panel details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-emerald-500 w-5 h-5 shrink-0" />
          <div className="text-left">
            <h3 className="text-sm font-sans font-extrabold text-stone-100 uppercase tracking-wider">
              Cash Stream Accumulation Ledger
            </h3>
            <span className="text-[10px] font-mono text-stone-400 block">
              Drag on bottom navigator timeline to Zoom in. Double-click or click Reset.
            </span>
          </div>
        </div>

        {/* Toggles and Zoom Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto select-none">
          {zoomDomain && (
            <button
              id="reset-chart-zoom"
              onClick={() => setZoomDomain(null)}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-stone-950 hover:bg-stone-850 text-emerald-400 border border-emerald-950 hover:border-emerald-700 rounded-lg cursor-pointer transition-all shrink-0"
              title="Reset Zoom to full 30 days"
            >
              <X className="w-3.5 h-3.5" />
              Reset Zoom
            </button>
          )}

          <div className="flex items-center bg-stone-950 p-1 border border-stone-850 rounded-lg shrink-0">
            <button
              id="toggle-chart-cumulative"
              onClick={() => setChartType('cumulative')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold rounded-md cursor-pointer transition-colors ${
                chartType === 'cumulative'
                  ? 'bg-emerald-600 text-stone-950 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              Cumulative Spend
            </button>
            <button
              id="toggle-chart-daily"
              onClick={() => setChartType('daily')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold rounded-md cursor-pointer transition-colors ${
                chartType === 'daily'
                  ? 'bg-emerald-600 text-stone-950 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Daily Flows
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas block */}
      <div className="relative pt-2">
        <svg 
          ref={svgRef}
          width="100%"
          height={dimensions.height}
          className="overflow-visible select-none"
        />

        {/* CSS Tooltip overlays */}
        {hoveredPoint && tooltipPos && (
          <div 
            className="absolute z-20 bg-stone-950 border border-stone-850 p-2.5 rounded-lg text-left font-mono text-[10px] shadow-2xl space-y-1 block pointer-events-none transition-all"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 65}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-stone-400 font-bold border-b border-stone-850 pb-0.5 mb-1 text-center">
              {hoveredPoint.dateStr}
            </div>
            <div className="flex justify-between gap-6">
              <span>Accumulated Till:</span>
              <span className="text-emerald-400 font-extrabold">${hoveredPoint.cumulative.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Daily Total:</span>
              <span className="text-stone-100 font-bold">${hoveredPoint.daily.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Micro legend summary tags */}
      <div className="flex items-center justify-between text-[9px] font-mono text-stone-550 border-t border-stone-850 pt-3">
        <div className="flex items-center gap-4 text-left">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block bg-opacity-80"></span>
            <span>Focus Active View</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block bg-opacity-30"></span>
            <span>Timeline Navigator</span>
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <span>Max Interval Peak: ${(d3.max(trendData, d => chartType === 'cumulative' ? d.cumulative : d.daily) || 0).toFixed(2)}</span>
          {zoomDomain && (
            <span className="text-emerald-500 font-bold animate-pulse">Zoomed Active</span>
          )}
        </div>
      </div>
    </div>
  );
}
