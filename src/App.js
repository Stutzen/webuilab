import axios from "axios";
import React, { useState, useEffect } from "react";
import { API_URL, API_URL_ADD } from './Admin/api';
import { Table, Button, Form, Checkbox } from 'semantic-ui-react';
import './App.css';

function App() {

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [emailAddr, setEmailAddress] = useState('');
  const [contNo, setContNo] = useState('');
  const [checked, setChecked] = useState(false);

  const [qty, setQty] = useState(0);
  const [subtotal, setPrice] = useState(0);

  const [apiData, setAPIData] = useState([]);

  const callGetAPI = async () => {
    const resp = await axios.get(API_URL)
    setAPIData(resp.data);
  }
  const sendData = async () => {
    await axios.post(API_URL_ADD, {
      firstName, 
      lastName, 
      emailAddr, 
      contNo, 
      checked
    })
  }
  useEffect(() => {
    callGetAPI();
  }, [])

  const handleQuantityIncrease = (index) => {
    const newItems = [...apiData];
    newItems[index].qty++;
    setQty(newItems); calculateTotal(index);
  };

  const handleQuantityDecrease = (index) => {
    const newItems = [...apiData];
    newItems[index].qty--;
    setQty(newItems); calculateTotal(index);
  };

  const handleQuantity = (index, value) => {
    const newItems = [...apiData];
    newItems[index].qty = value;
    setQty(newItems); calculateTotal(index);
  };

  const calculateTotal = (index) => {
    const prodList = [...apiData];
    const qty = prodList[index].qty;
    const price = prodList[index].price;
    const subtotal = qty * price; 
    prodList[index].subtotal = subtotal;
    setPrice(subtotal); calculateOtherValues(index);
  };
  
  const calculateOtherValues = (index) => {
    const newItems = [...apiData];
    const listItem = [];
    localStorage.setItem("list", JSON.stringify(newItems[index]));
    const list = localStorage.getItem("list"); 
    listItem.push(JSON.parse(list));
    console.log(listItem);
  }

  return (
    <section>
      <div className="header">
        <p>Contact : 9876543210</p>
        <img src="https://storage.googleapis.com/asset.iar.net.in/trial025_1.iar.net.in/28_11_2022/gh9dk9i/rsz_1lp(1).jpg" alt="logo" />
        <p className="hidden-xs"></p>
      </div>
      <div className="product">
        <div className="description">
          <div className="info-headertext ribbon">
            <strong className="ribbon-content"> Sri Tharani Crackers...Sivakasi to Sattur Road, Mettamalai - 626 203...Further Details Contact us: P.Muthukumar, 09600271793 (Whatsapp) &amp; 09487731793...Office: 8778730107...Email ID: sritharanicrackers21@gmail.com... Free Delivery For Above Rs.3000</strong>
          </div>
        </div>
        <div id="quick-shop">
          <div className="grouped_total">
            <div className="nop totel-box hidden-xs">
              <span className="nop-name">NUMBER OF PRODUCTS</span>
              <span className="nop-bor"></span>
              <span className="nop-bor-bot"></span>
              <p className="totalitems">
                <span className="nop-value" id="no_of_prd"> 0 </span> </p>
            </div>
            <div className="noi totel-box">
              <span className="nop-name">NUMBER OF ITEMS</span>
              <span className="nop-bor"></span>
              <span className="nop-bor-bot"></span>
              <p className="totalitems">
                <span className="nop-value" id="no_of_item"> 0 </span>
              </p> </div>
            <div className="ta totel-box">
              <span className="nop-name">TOTAL AMOUNT</span>
              <span className="nop-bor">
              </span>
              <span className="nop-bor-bot"></span>
              <p className="totalitems">
                <span className="nop-value" id="total_amount"> 0.00 </span> </p>
            </div>
            <div className="ys totel-box hidden-xs">
              <span className="nop-name">YOU SAVE</span>
              <span className="nop-bor"></span>
              <span className="nop-bor-bot"></span>
              <p className="totalitems">
                <span className="nop-value" id="your_save"> 0.00 </span>
              </p>
            </div>
            <div className="chk totel-box visible-xs">
                  <Button className="cls1" disabled value="Checkout">Checkout</Button>
              </div>
          </div>
          <div className="responsive-table">
          <Table singleLine className="productList">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell className="center">Image</Table.HeaderCell>
                <Table.HeaderCell className="left">Product Name</Table.HeaderCell>
                <Table.HeaderCell className="right">Price</Table.HeaderCell>
                <Table.HeaderCell className="center">Qty</Table.HeaderCell>
                <Table.HeaderCell className="right">Sub Total</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                apiData.map((data, index) => (
                  <Table.Row key={data.id} id={index}>
                    <Table.Cell className="center"><img src={data.image} alt="product"></img>
                    </Table.Cell>
                    <Table.Cell className="left prod-name">{data.productName}</Table.Cell>
                    <Table.Cell className="right prod-price">{data.price}</Table.Cell>
                    <Table.Cell className="center">
                      <div className="qtyCount">
                        <Button className="decrement" onClick={() => handleQuantityDecrease(index)}>-</Button>
                        <input inputmode="numeric" pattern="[0-9]*" type="number" className="form-control" value={data.qty} onChange={(event) => handleQuantity(index, event.target.value)} />
                        <Button className="increment" onClick={() => handleQuantityIncrease(index)}>+</Button>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="right"><input type="text" className="inputCtrl right" value={data.subtotal} readOnly /></Table.Cell>
                  </Table.Row>
                ))
              }
            </Table.Body>
          </Table>
          </div>
        </div>
        <Form className="contactForm">
          <Form.Field className="form-group">
            <label>Name <span>*</span></label>
            <input value={firstName} className="inputCtrl" onChange={event => setFirstName(event.target.value)} />
          </Form.Field>
          <Form.Field className="form-group">
            <label>Initial</label>
            <input value={lastName} className="inputCtrl" onChange={event => setLastName(event.target.value)} />
          </Form.Field>
          <Form.Field className="form-group">
            <label>Email Address <span>*</span></label>
            <input value={emailAddr} className="inputCtrl" onChange={event => setEmailAddress(event.target.value)} />
          </Form.Field>
          <Form.Field className="form-group">
            <label>Contact Number <span>*</span></label>
            <input value={contNo} className="inputCtrl" onChange={event => setContNo(event.target.value)} />
          </Form.Field>
          <Form.Field>
            <Checkbox checked={checked} label="I have read and agree to the terms and conditions" onChange={() => setChecked(!checked)} />
            <p>By checking the above box, you agree to all the terms and conditions mentioned under the Goodwill fireworks. To receive an active response to your B2B inquiries we suggest you place an order of minimum 1 lakh because the order value less than might get a very delayed or no response at all. In terms of our shipping policy, we have delivery offices placed at every location and you can collect your products there. The delivery policy also includes you to pay completely for the products to be shipped to your location. By checking the box you are acknowledged to all the policies mentioned under the T&C, Privacy Policies of the Goodwill fireworks and to the above-mentioned ones.</p>
          </Form.Field>
          <Form.Field className="right">
            <Button onClick={sendData} className="sendBtn">Send Enquiry</Button>
          </Form.Field>
        </Form>
      </div>
    </section>)
}
export default App