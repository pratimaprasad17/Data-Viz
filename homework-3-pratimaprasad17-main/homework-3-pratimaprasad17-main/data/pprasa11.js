const attributes =["Birth Rate", "Death Rate", "Fertility Rate", "Life Expectancy at Birth Female", "Life Expectancy at Birth Male", "Life Expectancy at Birth Total", "Population Density","Urban Population Percent","Urban Population Percent Growth","Telephone Lines per 100 People"];

let timer;
let data;
var filteredData=[];
var resultDataSet=[];

d3.csv("global_development_with_region.csv").then(function(data) {
    data = data.map(function(d) {
        var format = d3.format(".2f");
        return {
            region: d["World bank region"],
            country: d["Country"],
            year: +d["Year"],
            birthRate: +format(+d["Birth Rate"]),
            deathRate: +format(+d["Death Rate"]),
            fertilityRate: +format(+d["Fertility Rate"]),
            lifeExpectancyFemale: +format(+d["Life Expectancy at Birth Female"]),
            lifeExpectancyMale: +format(+d["Life Expectancy at Birth Male"]),
            lifeExpectancyTotal: +format(+d["Life Expectancy at Birth Total"]),
            populationDensity: +format(+d["Population Density"]),
            urbanPopulation: +format(+d["Urban Population Percent"]),
            urbanPopulationGrowth: +format(+d["Urban Population Percent Growth"]),
            telephoneLines: +format(+d["Telephone Lines per 100 People"]),
            imgURL: d["ImageURL"] 
        };
    });


// Define your SVG dimensions
const margin = { top: 20, right: 20, bottom: 10, left: 40 };
var width = document.getElementById("sub-column-1").offsetWidth - margin.left - margin.right;
var height = 750;

const regionColors = d3.scaleOrdinal()
    .domain(["North America", "Sub-Saharan Africa", "East Asia & Pacific", "South Asia", "Latin America & Caribbean", "Middle East & North Africa", "Europe & Central Asia"])
    .range(["#2596be", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#ff7f0e"]);
    
// Define variables for all HTML elements
var xAxisDropdown = document.getElementById("xAxisDropdown");
var sizeDropdown = document.getElementById("sizeDropdown");

var yearInput = document.getElementById("yearInput");

var columnNames = Object.keys(data[0]);
var excludedColumns = ["region", "country", "year", "imgURL"];

var playButton = document.getElementById("play-button");
//playButton.addEventListener("click", animateChart);

var circles; 
var svg;
var xScale;
var yScale;
var sizeScale;

var selectedRegions=[];
var xColumn;
var sizeColumn;

var newMin=0;
var newMax=0;

var oldMin = 0;
var oldMax =0;

var oldxColumn;
var oldsizeColumn;
var xColumnText;
var sizeColumnText;
var selectedyear;

var simulation;

oldxColumn = document.getElementById("xAxisDropdown").value;
oldsizeColumn = document.getElementById("sizeDropdown").value;

    columnNames = columnNames.filter(column => !excludedColumns.includes(column));

    // Populate the dropdown options for x Axis attributes
    let i=0;
    columnNames.forEach(function(column) {
        var option = document.createElement("option");
        option.value = column;
        option.text = attributes[i++];
        xAxisDropdown.appendChild(option);
    });
    xAxisDropdown.selectedIndex=0;

    // Populate the dropdown options for size attributes
    i=0;
    columnNames.forEach(function(column) {
        var option = document.createElement("option");
        option.value = column;
        option.text = attributes[i++];
        sizeDropdown.appendChild(option);
    });
    sizeDropdown.selectedIndex=1;

    var regions = Array.from(new Set(data.map(d => d.region))); // List of unique regions

    // Generate checkboxes on page load
    generateCheckboxes(regions);
  
    document.getElementById("select_all").addEventListener("click",function() {
        document.querySelectorAll(".worldRegion_dropdown input[type='checkbox']").forEach(checkbox => checkbox.checked = true);
        selectedRegions = [...regions];
        console.log(selectedRegions);
        updateChart();
    });

    document.getElementById("deselect_all").onclick = function() {
        document.querySelectorAll(".worldRegion_dropdown").forEach(checkbox => checkbox.checked = false);
        selectedRegions = [];
        console.log(selectedRegions);
        updateChart();
    }; 
  
    var oldData = data.filter(d => (d["region"]==="North America") &&
            d.year===2013
        );
        console.log(oldData);
    oldMin = d3.min(oldData, function (d) { return d.birthRate; });
    oldMax = d3.max(oldData, function (d) { return d.birthRate; });

    console.log("oldMin : "+oldMin);
    console.log("oldMax : "+oldMax);

    // Set up event listeners for dropdowns and call the updateChart function
    updateChart();
    xAxisDropdown.addEventListener("change", updateChart);
    sizeDropdown.addEventListener("change", updateChart);

    yearInput.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function(){
            updateChart();
        }, 1000);        
      });

    // Function to manage checked regions array
    function manageCheckedRegions(region, isChecked) {
        if(isChecked) {
            selectedRegions.push(region);
        } else {
            var index = selectedRegions.indexOf(region);
            if(index !== -1) {
                selectedRegions.splice(index, 1);
            }
        }
        console.log(selectedRegions);
        updateChart();
    }


    function updateChart(){

        width = document.getElementById("sub-column-1").offsetWidth - margin.left - margin.right;
        height = 750;
        // Step 1: Filter data based on dropdown_3 selections
        // Step 2: Determine the x-axis and circle size columns based on x-axis and size attribute selections


        xColumn = document.getElementById("xAxisDropdown").value;
        oldxColumn = d3.select("#xAxisDropdown").property("previousValue");
        console.log("previous oldxcolum :"+oldxColumn);
        d3.select("#xAxisDropdown").property("previousValue", xColumn);
        xColumnText = document.getElementById("xAxisDropdown").options[document.getElementById("xAxisDropdown").selectedIndex].text;
     //   console.log("xColumnText"+xColumnText);
        
        sizeColumn = document.getElementById("sizeDropdown").value;
        oldsizeColumn = d3.select("#sizeDropdown").property("previousValue");
        d3.select("#sizeDropdown").property("previousValue", sizeColumn);
        console.log("previous oldsizeColumn : "+oldsizeColumn);
        sizeColumnText = document.getElementById("sizeDropdown").options[document.getElementById("sizeDropdown").selectedIndex].text;
    //    selectedCountries = Array.from(document.getElementById("countries_dropdown").selectedOptions).map(option => option.value);
        
        selectedyear = parseInt(document.getElementById("yearInput").value);
    
        console.log("selectedRegions : "+selectedRegions);
    //    console.log("selectedCountries : "+selectedCountries);
        console.log("xColumn : "+xColumn);
        console.log("sizeColumn : "+sizeColumn); 
        console.log("selectedyear : "+selectedyear);       
        console.log(typeof(data[0]["year"]));

        filteredData = data.filter(d => selectedRegions.includes(d["region"]) &&
        //    selectedCountries.includes(d["country"]) &&
            d.year===selectedyear
        );

        resultDataSet = filteredData.map(function (item) {
            return { region: item.region, country: item.country, year: item.year, [xColumn]: item[xColumn], [oldxColumn]: item[oldxColumn], [sizeColumn]: item[sizeColumn], [oldsizeColumn]: item[oldsizeColumn], imgURL: item.imgURL
             //   oldX: item.x, oldY: item.y
            };
        });

        console.log(resultDataSet);
        console.log(resultDataSet[0][xColumn]);


       d3.select("#beeswamp-svg").selectAll("g").remove();
    //    circles.exit().remove();

        // Create an SVG element for beeswamp chart
        svg = d3.select("#beeswamp-svg")
            .attr("width", width)
            .attr("height", height)
            .append("g");

            console.log("oldMin : "+oldMin);
            console.log("oldMax : "+ oldMax);

        // Define x-axis scale based on xColumn
        xScale = d3.scaleLinear()
          //  .domain([oldMin, oldMax])
            .domain(d3.min(resultDataSet, d => d[xColumn]), d3.max(resultDataSet, d => d[xColumn]))
            // .range([margin.left, width - margin.right])
            .range([margin.left, width - margin.right])
            ;

        // Define circle size scale based on sizeColumn
        sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(resultDataSet, d => d[sizeColumn])])
            .range([2, 20])
            ;

        yScale = d3.scaleBand()
            .domain(filteredData.map(d => d.region))
            .range([0, height])
            .padding(0.1);

        // Create axis
        var xAxisLabel = svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + (height - 20) + ")") // Adjust the position of the x-axis
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", "translate(0," + (width - 20) + ")")
            .call(d3.axisLeft(yScale));

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Animating the x-axis ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the new min/max values based on the selected attribute
        newMin = d3.min(resultDataSet, function (d) { return d[xColumn]; });
        newMax = d3.max(resultDataSet, function (d) { return d[xColumn]; });

        console.log(xColumn);
        console.log("newMin : "+newMin);
        console.log("newMax : "+ newMax);

        // Transition for fading out the current x-axis label
        xAxisLabel.transition()
            .delay(500)
            .duration(500) 
            .style("opacity", 0)
            .on("end", function () {
                // Remove the old x-axis label after fading out
               xAxisLabel.remove();
            });
            // Update the x-scale with the new domain
            xScale.domain([newMin, newMax]);

            // Transition for animating the x-axis to the new values
            svg.select(".x-axis")
                .transition()
                .delay(500)
                .duration(500)  
                .call(d3.axisBottom(xScale));
        
        xAxisLabel.transition()
            .delay(500)
            .duration(500)
            .style("opacity", 1);
                
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Animating the circle position ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        
        // Create circles with new data
        var circles = d3.select("#beeswamp-svg")
            .selectAll(".circle")
            .data(resultDataSet, d => d.country);

        // Remove circles that are not in the new data
        // circles.exit()
        //     .transition()
        //     .duration(500)
        //     .attr("cx", width) // Move the removed circles off-screen
        //     .remove();

        console.log(resultDataSet);

        var bubbles=circles.join("circle")
        .attr("class", "circle")
        .transition()
        .delay(function (d, i) {
            return Math.random() * 1000 + 800;
        })
        .duration(function (d, i) {
            return 500 + Math.random() * 500;
        })
        .attr("cx", d => xScale(d[oldxColumn]))
        .attr("cy", d => yScale(d.region))
        .attr("r", d => sizeScale(d[sizeColumn]))
        .style("fill", d => regionColors(d.region))
        .style("stroke", "black")
        .style("stroke-width", "1px")
        ; 

        circles.join("circle")
            .attr("class", "circle")
            .transition()
            .delay(function (d, i) {
                return Math.random() * 1000 + 800;
            })
            .duration(function (d, i) {
                return 500 + Math.random() * 500;
            })
            .attr("cx", d => xScale(d[xColumn]))
            .attr("cy", d => yScale(d.region))
            .attr("r", d => sizeScale(d[sizeColumn]))
            .style("fill", d => regionColors(d.region))
            .style("stroke", "black")
            .style("stroke-width", "1px")
            ; 
         // Set up a force simulation for the beeswarm layout
        simulation = d3.forceSimulation(resultDataSet)
            .force("x", d3.forceX(d => xScale(d[xColumn])).strength(1)) // Adjust the strength
            .force("y", d3.forceY(d => yScale(d.region)).strength(1))
            // .force("collide", d3.forceCollide(d => sizeScale(d[sizeColumn]) +5).iterations(10)) 
            .force("collide", d3.forceCollide(d => sizeScale(d[sizeColumn]))  // Adjust collision parameters
                .radius(d => sizeScale(d[sizeColumn]) + 2).iterations(10))
            .alphaDecay(0)
            .alpha(0.3)
            .on("tick", function () {
                circles.join("circle")
                    .attr("class", "circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    ;})
           .stop()
           ;

        for (let i = 0; i < resultDataSet.length; ++i) {
            simulation.tick();
        }

        //   simulation.alphaTarget(0.3).restart();
        let init_decay = setTimeout(function () {
            console.log("start alpha decay");
            simulation.alphaDecay(0.1);
          }, 3000);

        circles.each(function(d) {
            d3.select(this)
                .on("mouseover", onMouseOver)
          //      .on("mousemove", onMouseMove)
                .on("mouseout", onMouseOut);
        });
          
    
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Create a legend ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        const legend = d3.select("#legend")
            .attr("width", width) // Adjust the width as needed
            .attr("height", 25); // Adjust the height as needed

        var regionLegend =[];
        regionLegend = Array.from(new Set(resultDataSet.map(d => d.region)));

        const spacing = 20; // Adjust the spacing between legend items
        const itemHeight = 15; // Height of each legend item
        let totalWidth = 0;

        // First, remove all existing legend items
        legend.selectAll("*").remove();

        const legendItems = legend
            .selectAll("g")
            .data(regionLegend)
            .enter()
            .append("g");

        legendItems
            .append("rect")
            .attr("width", 10)
            .attr("height", itemHeight / 1.3)
            .style("fill", (d) => regionColors(d));

        legendItems
            .append("text")
            .attr("x", 15)
            .attr("y", itemHeight / 1.3)
            .text((d) => d)
            .style("font-size", 13);

        let xPosition = 0;

        legendItems.each(function (d, i) {
        const legendItem = d3.select(this);
        const rectWidth = legendItem.select("rect").node().getBBox().width;
        const textWidth = legendItem.select("text").node().getBBox().width;
        const itemWidth = rectWidth + textWidth;

        if (i > 0) {
            totalWidth += spacing; // Add spacing before the item, but not before the first item.
        }

        legendItem.attr("transform", `translate(${totalWidth}, 0)`);
        totalWidth += itemWidth;
        });

        // Set the width of the legend container to the total width
        legend.attr("width", totalWidth+10);
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Create a key for min/max circle size ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        
        const sizeKeyBox = d3.select("#key");
        sizeKeyBox.text("");
        sizeKeyBox.text("Min : "+d3.min(resultDataSet, d => d[sizeColumn])+" || Max : "+d3.max(resultDataSet, d => d[sizeColumn]));

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ For tooltip ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const tooltip = d3.select("#tooltip")
            .append("tooltip")
            .attr("class", "tooltip")
            .style("opacity", 0);

        function onMouseOver(event, d) {
            tooltip.style("opacity", 1)
                .style("display", "block")
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY) + "px")
                .html(`<img src="${d.imgURL}" style="width: 50px;"></br><strong>${d.country}</strong> </br> ${xColumnText} : ${d[xColumn]}</br>${sizeColumnText} : ${d[sizeColumn]}`)
                .style("z-index", "999");
        }
    
        function onMouseMove(event, d){
            tooltip.style("display", "block").style("left", (event.pageX) + "px")
                .style("top", (event.pageY) + "px")
        }
    
        function onMouseOut(){
            tooltip.style("opacity", 0)
                .style("display", "none");
        }

            oldMin=newMin;
            oldMax=newMax;

         
    }
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ To animate chart on "Play" button ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function animateChart(){
        // Play button functionality
        let isPlaying = false;
        let currentYear = d3.min(data, d => d.year);
        console.log(currentYear);
      //  let years = d3.set(data.map(d => d.year)).values().sort(d3.ascending);
        const tempDataSet = data.filter(d => selectedRegions.includes(d["region"]) &&
            selectedCountries.includes(d["country"])
        );

        console.log(tempDataSet);
        let years = Array.from(new Set(tempDataSet.map(d => d.year))).sort(d3.ascending); 
        console.log(years);

        circles = svg.selectAll("circle").data(tempDataSet);

        function animateYear(year) {
            // Filter data for the current year
            const filteredDataYear = tempDataSet.filter(d => d.year === year);
            console.log(filteredDataYear);
            // Animate circles for this year

            var simulation = d3.forceSimulation(filteredDataYear)
            .force("x", d3.forceX(d => xScale(d[xColumn])).strength(1)) // Adjust the strength
            .force("y", d3.forceY(d => yScale(d.region)).strength(1))
            .force("collide", d3.forceCollide(d => sizeScale(d[sizeColumn]) + 2).iterations(5)) // Adjust collision parameters
            .stop();

            // Run the simulation
            for (let i = 0; i < 120; ++i) {simulation.tick();};

            circles.exit().remove();

            circles = svg.selectAll("circle")
                .data(filteredDataYear)
                .enter()
                .append("circle")
                .attr("class", "circle")
                .transition()
                .duration(1000)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y) // Adjust the y-position as needed
                .attr("r", (d, i) => sizeScale(resultDataSet[i][sizeColumn]))
                .style("fill", d => regionColors(d.region))
                .style("stroke", "black")  
                .style("stroke-width", "1px");

            // Update the year in a text element
           // d3.select("#currentYear").text(year);

            if (year < d3.max(years)) {
                setTimeout(() => {
                    if (isPlaying) {
                        const nextYear = years[years.indexOf(year) + 1];
                        animateYear(nextYear);
                    }
                }, 1500); // Delay before animating the next year
            }
        }

        d3.select("#play-Button").on("click", function () {
            if (!isPlaying) {
                isPlaying = true;
                animateYear(currentYear);
            } else {
                isPlaying = false;
            }
        });

        // Initialize the chart
        animateYear(currentYear);    
    }

   // Function to generate checkboxes
    function generateCheckboxes(regions){
        var container = document.getElementById("worldRegion_dropdown");

        for(var i = 0; i<regions.length; i++){
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "regions";
            checkbox.value = regions[i];

            if (i === 0) {
                checkbox.checked = true;
                manageCheckedRegions(regions[i], true);
            }

            var label = document.createElement("label");
            label.appendChild(document.createTextNode(regions[i]));

            checkbox.addEventListener("change",function() {
                manageCheckedRegions(this.value, this.checked);
                console.log(selectedRegions); // for debugging
            });

            // checkbox.addEventListener("mouseover", function () {
            //     onMouseOver(event, this.data); // Assuming you have 'data' associated with each checkbox
            // });

            container.appendChild(checkbox);
            container.appendChild(label);
            container.appendChild(document.createElement("br"));
        }

        var selectAllBtn = document.createElement("input");
        selectAllBtn.type = "button";
        selectAllBtn.id = "select_all";
        selectAllBtn.value = "Select All";
        selectAllBtn.addEventListener("click", function(){
            var allRegions = document.querySelectorAll(".regions");
            for(var i = 0; i<allRegions.length; i++){
                allRegions[i].checked = true;
                manageCheckedRegions(allRegions[i].value, allRegions[i].checked);
            }
        });

        var deselectAllBtn = document.createElement("input");
        deselectAllBtn.type = "button";
        deselectAllBtn.id = "deselect_all";
        deselectAllBtn.value = "Deselect All";
        deselectAllBtn.addEventListener("click", function(){
            var allRegions = document.querySelectorAll(".regions");
            for(var i = 0; i<allRegions.length; i++){
                if (i === 0) {
                    allRegions[i].checked = true;
                } else {
                    allRegions[i].checked = false;
                }
                manageCheckedRegions(allRegions[i].value, allRegions[i].checked);
            }
        });

        container.appendChild(selectAllBtn);
        container.appendChild(deselectAllBtn);

        var containerWidth = selectAllBtn.parentNode.offsetWidth;
        var buttonWidth = containerWidth * 0.5;

        // Set the width of the buttons
        selectAllBtn.style.width = (buttonWidth - 1) + "px";
        deselectAllBtn.style.width = (buttonWidth - 1) + "px";
    }

});
