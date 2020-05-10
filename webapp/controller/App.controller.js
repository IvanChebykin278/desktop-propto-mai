sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Image",
	"sap/m/Button",
	"sap/ui/core/Fragment"
], function (BaseController, JSONModel, formatter, MessageToast, Dialog, Image, Button, Fragment) {
	"use strict";

	return BaseController.extend("dev.desktop.app.controller.App", {
		
		formatter: formatter,
		
		_toRadian: function(a) {
			return a * (Math.PI / 180);	
		},
		
		_getDistance: function(a, b) {
			var fa = this._toRadian(a[0]),
				fb = this._toRadian(b[0]),
				la = this._toRadian(a[1]),
				lb = this._toRadian(b[1]);
			
			var cosd = Math.sin(fa)*Math.sin(fb) + Math.cos(fa)* Math.cos(fb)* Math.cos(la - lb);
		
			return Math.acos(cosd) * 6371000;
		},
		
		_checkIn: function(stuff, zone) {
	        var x = stuff[0];
	        var y = stuff[1];
	        var in_polygon = false;
	        for(var i = 1; i < zone.length; i++) {
	            var xp = zone[i][0];
	            var yp = zone[i][1];
	            var xp_prev = zone[i-1][0];
	            var yp_prev = zone[i-1][1];
	            if (((yp <= y && y < yp_prev) || (yp_prev <= y &&  y < yp)) &&  (x > (xp_prev - xp) * (y - yp) / (yp_prev - yp) + xp)) {
	            	in_polygon = true;
	            } else {
	            	in_polygon = false;
	            }
	        }
	        
	        
	        
	        return in_polygon;
		},
		
		onInit: function () {
			var oViewModel = new JSONModel({
				selectedStuff: {},
				selectedZone: {},
				selectedTool: {},
				isMyPosition: true,
				myPosition: null,
				map: null
			});
			
			this.getView().setModel(oViewModel, 'appView');
		},
		
		onBeforeRendering: function() {
			
			var map;
			
			var oStuffModel = this.getView().getModel('stuff'),
				oZonesModel = this.getView().getModel('zones'),
				oToolsModel = this.getView().getModel('tools'),
				oViewModel = this.getView().getModel('appView');
				
			var aStuff = oStuffModel.getData(),
				aZones = oZonesModel.getData(),
				aTools = oToolsModel.getData(),
				oView = oViewModel.getData();
				
			oViewModel.setProperty('/selectedZone', aZones[0]);
			oViewModel.setProperty('/selectedTool', aTools[0]);
	

		    DG.then(function () {
		    	
		    	var polygons = DG.featureGroup();
		    	
		        map = DG.map('container-desktop.app---App--map', {
		            center: [55.974247, 37.4058723],
		            zoom: 13,
                    minZoom: 13,
                    maxZoom: 20
		        });
		        
		        map.on('click', function(event) {
			    	if(oView.isMyPosition) {
			    		oViewModel.setProperty('/myPosition', event.latlng);
			    	}
			    });
                
                aStuff.map(function(stuff) {
                	DG.marker(stuff.position, {
                		alt: stuff.id,
                		title: stuff.name,
                		icon: DG.divIcon({className: `fa fa-map-marker fa-stack-2x icon-${stuff.status}`})
                	})
                	.on('click', function(event) {
                		var nId = event.target.options.alt;
                		
                		var oEmployee = aStuff.find(function(e) { if(e.id === nId) return true });
                		
                		oViewModel.setProperty('/selectedStuff', oEmployee);
                	})
                	.addTo(map);
            	});
            	
            	for(var i = 0; i < aZones.length; i++) {
            		DG.polygon(aZones[i].position, {color: aZones[i].color}).addTo(polygons);
            	}
            
                polygons.addTo(map);

                map.fitBounds(polygons.getBounds());
		        
		        oViewModel.setProperty('/map', map);
		    });
		},
		
		onSwitchClick: function(event) {
			var oViewModel = this.getView().getModel('appView'),
				oZonesModel = this.getView().getModel('zones');
			
			oViewModel.setProperty('/isMyPosition', !oViewModel.getProperty('/isMyPosition'));
			oViewModel.setProperty('/myPosition', null);
			
		},
		
		onNearestButtonClick: function() {
			
			var oViewModel = this.getView().getModel('appView'),
				oStuffModel = this.getView().getModel('stuff');
				
			var oView = oViewModel.getData(),
				aStuff = oStuffModel.getData();
			
			if(oView.isMyPosition && oView.myPosition) {
				// ok its point
				var minDistance = Number.MAX_VALUE;
				var currentStuff = null;
				var selectedPosition = [oView.myPosition.lat, oView.myPosition.lng];
				
				for(var i = 0; i < aStuff.length; i++) {
					var dist = this._getDistance(selectedPosition, aStuff[i].position);
					
					if(dist < minDistance && !aStuff[i].status !== 'inaccessible') {
						minDistance = dist;
						currentStuff = aStuff[i];
					}
				}
				
				oViewModel.setProperty('/selectedStuff', currentStuff);
				MessageToast.show(`Ближайший работник: ${currentStuff.name}\nРасстояние: ${Math.floor(minDistance)} метров`);
				
				return;
			} else {
				if(!oView.isMyPosition) {
					var zonePosition = oView.selectedZone.position;
					var minDistance = Number.MAX_VALUE;
					var currentStuff = null;
					
					for(var i = 0; i < aStuff.length; i++) {
						if(this._checkIn(aStuff[i], zonePosition)) {
							continue;
						}
						for(var j = 0; j < zonePosition.length; j++) {
							var dist = this._getDistance(zonePosition[j], aStuff[i].position);
					
							if(dist < minDistance && !aStuff[i].status !== 'inaccessible') {
								minDistance = dist;
								currentStuff = aStuff[i];
							}
						}
					}
					
					oViewModel.setProperty('/selectedStuff', currentStuff);
					MessageToast.show(`Ближайший работник: ${currentStuff.name}\nРасстояние: ${Math.floor(minDistance)} метров`);
					
					return;
				}
				
				MessageToast.show('Выберте точку назначения');
				return;
			}
		},
		
		onSelectChange: function(event) {
			var aId = event.getSource().getId().split('--'),
				id = aId[aId.length - 1];
			var itemKey = event.getSource().getSelectedKey();
			var oModel;
			
			if(id === 'selectedTool') {
				oModel = this.getView().getModel('tools');
			} else {
				oModel = this.getView().getModel('zones');
			}
			
			var aData = oModel.getData();
			
			var currentItem = aData.find(function(e) { if(e.id === Number(itemKey)) return true });
			
			var	oViewModel = this.getView().getModel('appView');
			
			oViewModel.setProperty(`/${id}`, currentItem);
				
			debugger;
		},
		
		pressDialog: null,
		fixedSizeDialog: null,
		
		onOrderPress: function(event) {
			if (!this.pressDialog) {
				this.pressDialog = new Dialog({
					title: "Отчет",
					content: new Image({
						width: '800px',
						height: 'auto',
						src: 'https://sun1-99.userapi.com/_xZuCK1czROnHRXUlxl9GlkXi6wjj8JRZQIbWA/eEkJe8kl9To.jpg' }),
					endButton: new Button({
						text: "Закрыть",
						press: function () {
							this.pressDialog.close();
						}.bind(this)
					})
				});

				//to get access to the global model
				this.getView().addDependent(this.pressDialog);
			}

			this.pressDialog.open();
		},
		
		onOpenDialog: function () {
			var oView = this.getView();

			// create dialog lazily
			if (!this.byId("helloDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "dev.desktop.app.view.HelloDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("helloDialog").open();
			}
		},
		
		dialogClose: function(event) {
			this.getView().byId('helloDialog').close();	
		},
		
		onSubmitClick: function() {
			MessageToast.show('Уведомление отправлено');
		}
		
	});
});